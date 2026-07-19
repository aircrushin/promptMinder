import { config as loadEnv } from 'dotenv'
import postgres from 'postgres'
import {
  assessSkillAudits,
  canRedistributeSkill,
  parseSkillFrontmatter,
} from '../lib/skills-sync.js'

loadEnv({ path: '.env.local' })
loadEnv()

const SKILLS_API = 'https://www.skills.sh/api/v1'
const MAX_FILE_BYTES = 500_000
const MAX_SKILL_BYTES = 2_000_000
const SYNC_CONCURRENCY = 5

function readArguments(argv) {
  const all = argv.includes('--all')
  const skipExisting = argv.includes('--skip-existing')
  const limitArg = argv.find((arg) => arg.startsWith('--limit='))
  const startArg = argv.find((arg) => arg.startsWith('--start='))
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : 50
  const start = startArg ? Number.parseInt(startArg.split('=')[1], 10) : 0
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error('--limit must be a non-negative integer')
  }
  if (!Number.isInteger(start) || start < 0) {
    throw new Error('--start must be a non-negative integer')
  }
  return { all, skipExisting, limit, start }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeText(value) {
  return typeof value === 'string' ? value.replaceAll('\0', '') : value
}

async function fetchJson(url, {
  headers = {},
  allowNotFound = false,
  allowBadRequest = false,
  allowedStatuses = [],
} = {}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers })
      if (allowNotFound && response.status === 404) return null
      if (allowBadRequest && response.status === 400) return null
      if (allowedStatuses.includes(response.status)) return null
      if ([429, 503].includes(response.status) && attempt < 4) {
        const retryAfter = Number.parseInt(response.headers.get('retry-after') || '1', 10)
        await wait(Math.max(1, retryAfter) * 1000)
        continue
      }
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`)
      }
      return response.json()
    } catch (error) {
      if (attempt === 4 || /^4\d\d /.test(error.message)) throw error
      await wait(2 ** attempt * 1000)
    }
  }
  throw new Error(`Rate limit persisted for ${url}`)
}

async function listSkills(headers, { all, limit }) {
  if (!all) {
    const payload = await fetchJson(`${SKILLS_API}/skills/curated`, { headers })
    const skills = payload.data.flatMap((owner) => owner.skills || [])
    return limit === 0 ? skills : skills.slice(0, limit)
  }

  const skills = []
  let page = 0
  while (limit === 0 || skills.length < limit) {
    const payload = await fetchJson(
      `${SKILLS_API}/skills?view=all-time&page=${page}&per_page=500`,
      { headers }
    )
    skills.push(...payload.data)
    if (!payload.pagination.hasMore) break
    page += 1
  }
  return limit === 0 ? skills : skills.slice(0, limit)
}

function safeFiles(files = []) {
  let totalBytes = 0
  const accepted = []

  for (const file of files) {
    if (typeof file.path !== 'string' || typeof file.contents !== 'string') continue
    const contents = safeText(file.contents)
    const bytes = Buffer.byteLength(contents)
    if (bytes > MAX_FILE_BYTES || totalBytes + bytes > MAX_SKILL_BYTES) continue
    accepted.push({ path: safeText(file.path), contents })
    totalBytes += bytes
  }

  return accepted
}

async function main() {
  const { all, skipExisting, limit, start } = readArguments(process.argv.slice(2))
  const skillsToken = process.env.SKILLS_SH_TOKEN || process.env.VERCEL_OIDC_TOKEN
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  if (!skillsToken) throw new Error('SKILLS_SH_TOKEN or VERCEL_OIDC_TOKEN is required')

  const skillsHeaders = { Authorization: `Bearer ${skillsToken}` }
  const githubHeaders = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'PromptMinder-Skills-Sync',
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  }
  const sql = postgres(process.env.DATABASE_URL, { max: SYNC_CONCURRENCY })
  const licenseCache = new Map()

  const getLicense = async (skill) => {
    if (skill.sourceType !== 'github' || !/^[^/]+\/[^/]+$/.test(skill.source)) return null
    if (!licenseCache.has(skill.source)) {
      licenseCache.set(skill.source, fetchJson(
        `https://api.github.com/repos/${skill.source}/license`,
        { headers: githubHeaders, allowNotFound: true, allowedStatuses: [451] }
      ))
    }
    return licenseCache.get(skill.source)
  }

  try {
    const listedSkills = await listSkills(skillsHeaders, { all, limit })
    let existingIds = new Set()
    if (skipExisting) {
      const rows = await sql`SELECT external_id FROM catalog_skills`
      existingIds = new Set(rows.map((row) => row.external_id))
      console.log(`Found ${existingIds.size} skills already in database; skipping them.`)
    }

    const skills = listedSkills
      .slice(start)
      .filter((skill) => !existingIds.has(skill.id))
    const skipped = listedSkills.slice(start).length - skills.length
    if (skipExisting) {
      console.log(`Queued ${skills.length} new skills (${skipped} skipped).`)
    }

    let nextIndex = 0
    let imported = 0

    const syncSkill = async (skill) => {
      const [detail, auditPayload, license] = await Promise.all([
        fetchJson(`${SKILLS_API}/skills/${skill.id}`, {
          headers: skillsHeaders,
          allowBadRequest: true,
        }),
        fetchJson(`${SKILLS_API}/skills/audit/${skill.id}`, {
          headers: skillsHeaders,
          allowNotFound: true,
          allowBadRequest: true,
        }),
        getLicense(skill),
      ])

      const audit = assessSkillAudits(auditPayload?.audits, { curated: !all })
      const licenseSpdx = license?.license?.spdx_id || null
      const redistributable = canRedistributeSkill({
        licenseSpdx,
        auditStatus: audit.status,
      })
      const files = redistributable ? safeFiles(detail?.files) : []
      const skillFile = files.find((file) => file.path === 'SKILL.md')
      const frontmatter = parseSkillFrontmatter(skillFile?.contents)
      const content = skillFile?.contents || null

      await sql`
        INSERT INTO catalog_skills (
          external_id, slug, name, description, source, source_type, install_url,
          skills_sh_url, installs, content, files, content_hash, license_spdx,
          license_url, audit_status, audit_summary, is_curated, synced_at, updated_at
        ) VALUES (
          ${safeText(skill.id)}, ${safeText(skill.slug)}, ${safeText(frontmatter.name || skill.name || skill.slug)},
          ${safeText(frontmatter.description) || null}, ${safeText(skill.source)}, ${safeText(skill.sourceType)},
          ${safeText(skill.installUrl) || null}, ${safeText(skill.url)}, ${skill.installs || 0}, ${content},
          ${sql.json(files)}, ${detail?.hash || null}, ${licenseSpdx},
          ${safeText(license?.html_url) || null}, ${audit.status}, ${safeText(audit.summary)}, ${!all}, NOW(), NOW()
        )
        ON CONFLICT (external_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          source = EXCLUDED.source,
          source_type = EXCLUDED.source_type,
          install_url = EXCLUDED.install_url,
          skills_sh_url = EXCLUDED.skills_sh_url,
          installs = EXCLUDED.installs,
          content = EXCLUDED.content,
          files = EXCLUDED.files,
          content_hash = EXCLUDED.content_hash,
          license_spdx = EXCLUDED.license_spdx,
          license_url = EXCLUDED.license_url,
          audit_status = EXCLUDED.audit_status,
          audit_summary = EXCLUDED.audit_summary,
          is_curated = EXCLUDED.is_curated,
          synced_at = NOW(),
          updated_at = NOW()
      `

      imported += 1
      console.log(`${imported + start}/${listedSkills.length} ${skill.id}: ${content ? 'content' : 'metadata only'}`)
    }

    const worker = async () => {
      while (nextIndex < skills.length) {
        const skill = skills[nextIndex]
        nextIndex += 1
        await syncSkill(skill)
      }
    }

    await Promise.all(Array.from(
      { length: Math.min(SYNC_CONCURRENCY, skills.length) },
      () => worker()
    ))

    console.log(
      skipExisting
        ? `Synced ${imported} new skills (${skipped} already present skipped).`
        : `Synced ${imported} skills.`
    )
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

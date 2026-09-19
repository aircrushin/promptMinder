const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STRUCTURED_TOKEN_RE = /(?:^|\s)(?:\/)?(id|tag|team)[:：]([^\s]+)/gi

export function isUuid(value) {
  return UUID_RE.test(String(value || '').trim())
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function sanitizeLikeTerm(value) {
  return String(value || '')
    .replace(/[%_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

/**
 * Parse a fuzzy prompt lookup into structured filters.
 * Supports slash shortcuts (`/code-review`), tags (`tag:writing` or `#sql`),
 * exact ids (`id:<uuid>`), and team scope (`team:<uuid>`).
 */
export function parsePromptQuery(rawQuery = '') {
  const raw = normalizeWhitespace(rawQuery)
  const parsed = {
    raw,
    shortcut: null,
    search: '',
    tag: null,
    id: null,
    teamId: null,
  }

  if (!raw) {
    return parsed
  }

  let remaining = raw.replace(STRUCTURED_TOKEN_RE, (_, key, value) => {
    const token = String(key).toLowerCase()
    const normalizedValue = String(value || '').trim()
    if (!normalizedValue) {
      return ' '
    }
    if (token === 'id') {
      parsed.id = normalizedValue.replace(/^\/+/, '')
    } else if (token === 'tag') {
      parsed.tag = normalizedValue.replace(/^#/, '')
    } else if (token === 'team') {
      parsed.teamId = normalizedValue.replace(/^\/+/, '')
    }
    return ' '
  })

  remaining = remaining.replace(/(?:^|\s)#([^\s#]+)/g, (_, value) => {
    if (!parsed.tag) {
      parsed.tag = value
    }
    return ' '
  }).trim()

  if (remaining.startsWith('/')) {
    const shortcut = remaining.slice(1).trim()
    parsed.shortcut = shortcut || null
    remaining = shortcut.replace(/[-_]+/g, ' ')
  }

  parsed.search = normalizeWhitespace(remaining)

  const maybeId = raw.replace(/^\/+/, '')
  if (!parsed.id && isUuid(maybeId)) {
    parsed.id = maybeId
    parsed.search = ''
  }

  return parsed
}

export function rankPrompt(prompt, parsed) {
  const title = String(prompt.title || '').toLowerCase()
  const description = String(prompt.description || '').toLowerCase()
  const tags = String(prompt.tags || '').toLowerCase()
  const shortcut = String(parsed.shortcut || '').toLowerCase()
  const search = String(parsed.search || '').toLowerCase()
  const titleSlug = slugify(prompt.title)
  let score = 0

  if (parsed.id && String(prompt.id) === parsed.id) {
    return 1000
  }

  if (shortcut) {
    if (titleSlug === shortcut || title === shortcut.replace(/[-_]+/g, ' ')) {
      score += 100
    } else if (titleSlug.includes(shortcut) || title.includes(shortcut.replace(/[-_]+/g, ' '))) {
      score += 60
    }
  }

  if (search) {
    if (title === search) {
      score += 90
    } else if (title.startsWith(search)) {
      score += 75
    } else if (title.includes(search)) {
      score += 55
    }

    if (description.includes(search)) {
      score += 15
    }
    if (tags.includes(search)) {
      score += 20
    }
  }

  if (parsed.tag && tags.includes(String(parsed.tag).toLowerCase())) {
    score += 25
  }

  return score
}

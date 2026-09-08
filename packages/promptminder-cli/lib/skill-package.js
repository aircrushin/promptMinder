function cleanYamlValue(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed) } catch { /* YAML may use non-JSON escapes. */ }
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/''/g, "'")
  }
  return trimmed
}

function parseSkillFrontmatter(content = '') {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return {}

  const lines = match[1].split(/\r?\n/)
  const result = {}

  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^(name|description):\s*(.*)$/)
    if (!field) continue

    const [, key, rawValue] = field
    if (rawValue === '|' || rawValue === '>') {
      const parts = []
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        parts.push(lines[index + 1].trim())
        index += 1
      }
      result[key] = parts.join(rawValue === '>' ? ' ' : '\n').trim()
    } else {
      result[key] = cleanYamlValue(rawValue)
    }
  }

  return result
}

const MAX_FILES = 200;
const MAX_BYTES = 2 * 1024 * 1024;
const RECEIPT_PATH = '.promptminder-install.json';

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeSkillFile(file) {
  check(typeof file.contents === 'string', 'File contents must be a string.');
  if (!file.encoding || file.encoding === 'utf8') return new TextEncoder().encode(file.contents);
  check(file.encoding === 'base64' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.contents), 'Invalid file encoding.');
  const decoded = atob(file.contents);
  check(btoa(decoded) === file.contents, 'Non-canonical base64.');
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function normalizeSkillPackage(value) {
  check(value && value.format === 1 && Array.isArray(value.files), 'Expected a format 1 Skill package.');
  check(value.files.length > 0 && value.files.length <= MAX_FILES, 'A Skill supports 1–200 files.');
  const paths = new Set();
  let total = 0;
  const files = value.files.map((file) => {
    check(typeof file?.path === 'string' && file.path.length <= 240
      && !/[\\:\x00-\x1f\x7f]/.test(file.path)
      && file.path.split('/').every((part) => part && part !== '.' && part !== '..' && !/[. ]$/.test(part)), 'Unsafe file path.');
    const key = file.path.normalize('NFC').toLowerCase();
    check(key !== RECEIPT_PATH && !key.startsWith(RECEIPT_PATH + '/') && !paths.has(key), 'Duplicate or reserved file path.');
    paths.add(key);
    // Bound the encoded string before decoding an untrusted package.
    check(typeof file.contents === 'string' && file.contents.length <= MAX_BYTES * 2, 'Skill exceeds 2 MB.');
    total += decodeSkillFile(file).length;
    check(total <= MAX_BYTES, 'Skill exceeds 2 MB total.');
    return { path: file.path, contents: file.contents, encoding: file.encoding || 'utf8', executable: file.executable === true };
  });
  for (const path of paths) {
    const parts = path.split('/');
    parts.pop();
    while (parts.length) {
      check(!paths.has(parts.join('/')), 'A file conflicts with a directory.');
      parts.pop();
    }
  }
  const main = files.find((file) => file.path === 'SKILL.md');
  check(main?.encoding === 'utf8', 'A UTF-8 SKILL.md is required at the root.');
  const { name, description } = parseSkillFrontmatter(main.contents);
  check(typeof name === 'string' && name.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name), 'Invalid Skill name in SKILL.md.');
  check(typeof description === 'string' && description.trim() && description.length <= 1024, 'SKILL.md requires a description (1–1024 characters).');
  let source = null;
  if (value.source != null) {
    check(typeof value.source === 'object' && !Array.isArray(value.source), 'Invalid Skill source.');
    source = {};
    for (const key of ['catalog_id', 'url', 'license', 'revision', 'synced_at', 'scope']) {
      if (value.source[key] == null) continue;
      check(typeof value.source[key] === 'string' && value.source[key].length <= 2048, 'Invalid Skill source field.');
      source[key] = value.source[key];
    }
    check(!source.url || /^https?:\/\//.test(source.url), 'Source URL must use HTTP or HTTPS.');
    check(!source.catalog_id || /^[0-9a-f-]{36}$/i.test(source.catalog_id), 'Invalid catalog ID.');
  }
  return { format: 1, files, source };
}

function mergeSkillFiles(local, upstream, selectedPaths) {
  const selected = new Set(selectedPaths);
  const files = local.files.filter((file) => !selected.has(file.path));
  files.push(...upstream.files.filter((file) => selected.has(file.path)));
  return normalizeSkillPackage({ ...local, files, source: upstream.source });
}

module.exports = { parseSkillFrontmatter, normalizeSkillPackage, decodeSkillFile, mergeSkillFiles, MAX_FILES, MAX_BYTES, RECEIPT_PATH };

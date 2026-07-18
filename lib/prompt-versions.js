/**
 * Suggest the next free-text version after the current latest.
 * Prefers semver-style bumps when the input looks numeric.
 */
export function suggestNextVersion(currentVersion) {
  if (!currentVersion || typeof currentVersion !== 'string') {
    return '1.0.0'
  }

  const trimmed = currentVersion.trim()
  if (!trimmed) {
    return '1.0.0'
  }

  const semver = trimmed.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/)
  if (semver) {
    return `${semver[1]}.${semver[2]}.${Number(semver[3]) + 1}${semver[4] || ''}`
  }

  const minor = trimmed.match(/^(\d+)\.(\d+)(.*)$/)
  if (minor) {
    return `${minor[1]}.${Number(minor[2]) + 1}${minor[3] || ''}`
  }

  const major = trimmed.match(/^(\d+)(.*)$/)
  if (major) {
    return `${Number(major[1]) + 1}${major[2] || ''}`
  }

  return `${trimmed}-restored`
}

/**
 * Allocate a version string that does not collide with existing ones.
 */
export function allocateNextVersion(existingVersions = [], latestVersion) {
  const used = new Set(
    (existingVersions || [])
      .map((item) => (typeof item === 'string' ? item : item?.version))
      .filter(Boolean)
  )

  let next = suggestNextVersion(latestVersion)
  let guard = 0
  while (used.has(next) && guard < 50) {
    next = suggestNextVersion(next)
    guard += 1
  }
  return next
}

import { ApiError } from './api-error.js'

export const ADMIN_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function parseAdminToken(token) {
  if (!token) {
    return null
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const colonIndex = decoded.lastIndexOf(':')
    if (colonIndex <= 0) {
      return null
    }

    const email = decoded.slice(0, colonIndex).trim().toLowerCase()
    const timestamp = parseInt(decoded.slice(colonIndex + 1), 10)

    if (!email || Number.isNaN(timestamp)) {
      return null
    }

    const tokenAge = Date.now() - timestamp
    if (tokenAge > ADMIN_TOKEN_MAX_AGE_MS || tokenAge < 0) {
      return null
    }

    return { email, timestamp }
  } catch {
    return null
  }
}

export function verifyAdminRequest(request) {
  const adminEmail = request.headers.get('x-admin-email')?.trim().toLowerCase()
  const adminToken = request.headers.get('x-admin-token')?.trim()

  if (!adminEmail || !adminToken) {
    return { success: false, error: '未授权访问', status: 401 }
  }

  const adminEmails = getAdminEmails()
  if (adminEmails.length === 0) {
    return { success: false, error: '管理员未配置', status: 503 }
  }

  if (!adminEmails.includes(adminEmail)) {
    return { success: false, error: '无管理员权限', status: 403 }
  }

  const parsed = parseAdminToken(adminToken)
  if (!parsed || parsed.email !== adminEmail) {
    return { success: false, error: 'Token 无效或已过期', status: 401 }
  }

  return { success: true, email: adminEmail }
}

export function requireAdmin(request) {
  const result = verifyAdminRequest(request)
  if (!result.success) {
    throw new ApiError(result.status || 401, result.error || '未授权访问')
  }
  return result.email
}

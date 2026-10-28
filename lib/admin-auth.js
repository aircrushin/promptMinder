import { createHmac, timingSafeEqual } from 'node:crypto'
import { ApiError } from './api-error.js'

export const ADMIN_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000

function getTokenSecret() {
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.CLERK_SECRET_KEY
  if (!secret) throw new ApiError(503, 'Admin authentication is not configured')
  return secret
}

export function createAdminToken(email, timestamp = Date.now()) {
  const payload = `${email.trim().toLowerCase()}:${timestamp}`
  const signature = createHmac('sha256', getTokenSecret()).update(payload).digest('base64url')
  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

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
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split(':')
    if (parts.length !== 3) {
      return null
    }

    const [rawEmail, rawTimestamp, signature] = parts
    const email = rawEmail.trim().toLowerCase()
    const timestamp = Number.parseInt(rawTimestamp, 10)

    if (!email || Number.isNaN(timestamp)) {
      return null
    }

    const expected = createHmac('sha256', getTokenSecret()).update(`${email}:${timestamp}`).digest('base64url')
    const expectedBytes = Buffer.from(expected)
    const actualBytes = Buffer.from(signature || '')
    if (expectedBytes.length !== actualBytes.length || !timingSafeEqual(expectedBytes, actualBytes)) {
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

import crypto from 'crypto'
import { AUTH_COOKIE_NAME, SESSION_EXPIRY_MS } from './constants'

// 密码哈希 - 使用 PBKDF2
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// 验证密码
export function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

// 生成会话 token
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

// 会话过期时间（7天）
export const SESSION_DURATION_MS = SESSION_EXPIRY_MS

// Re-export cookie name
export { AUTH_COOKIE_NAME }

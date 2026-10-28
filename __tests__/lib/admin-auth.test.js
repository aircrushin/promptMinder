/** @jest-environment node */

import { NextRequest } from 'next/server'
import {
  ADMIN_TOKEN_MAX_AGE_MS,
  createAdminToken,
  getAdminEmails,
  parseAdminToken,
  requireAdmin,
  verifyAdminRequest,
} from '@/lib/admin-auth.js'
import { ApiError } from '@/lib/api-error.js'

describe('admin-auth', () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS
  const originalTokenSecret = process.env.ADMIN_TOKEN_SECRET

  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@example.com,other@example.com'
    process.env.ADMIN_TOKEN_SECRET = 'test-admin-token-secret'
  })

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails
    if (originalTokenSecret === undefined) delete process.env.ADMIN_TOKEN_SECRET
    else process.env.ADMIN_TOKEN_SECRET = originalTokenSecret
  })

  it('parses valid admin tokens', () => {
    const token = createAdminToken('admin@example.com')
    expect(parseAdminToken(token)).toEqual({
      email: 'admin@example.com',
      timestamp: expect.any(Number),
    })
  })

  it('rejects expired admin tokens', () => {
    const expiredTimestamp = Date.now() - ADMIN_TOKEN_MAX_AGE_MS - 1000
    const token = createAdminToken('admin@example.com', expiredTimestamp)
    expect(parseAdminToken(token)).toBeNull()
  })

  it('verifies admin requests with matching email and token', () => {
    const email = 'admin@example.com'
    const token = createAdminToken(email)
    const request = new NextRequest('http://localhost:3000/api/feedback', {
      headers: {
        'x-admin-email': email,
        'x-admin-token': token,
      },
    })

    expect(verifyAdminRequest(request)).toEqual({
      success: true,
      email,
    })
  })

  it('rejects admin requests with invalid tokens', () => {
    const request = new NextRequest('http://localhost:3000/api/feedback', {
      headers: {
        'x-admin-email': 'admin@example.com',
        'x-admin-token': 'invalid-token',
      },
    })

    expect(verifyAdminRequest(request)).toEqual({
      success: false,
      error: 'Token 无效或已过期',
      status: 401,
    })
  })

  it('throws ApiError when requireAdmin fails', () => {
    const request = new NextRequest('http://localhost:3000/api/feedback')

    expect(() => requireAdmin(request)).toThrow(ApiError)
  })

  it('loads admin emails from ADMIN_EMAILS', () => {
    expect(getAdminEmails()).toEqual(['admin@example.com', 'other@example.com'])
  })
})

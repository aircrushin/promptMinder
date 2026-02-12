import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db.js'
import { eq, and } from 'drizzle-orm'
import { providerKeys } from '@/drizzle/schema/index.js'

const KNOWN_PROVIDERS = new Set(['openai', 'anthropic', 'zhipu', 'custom'])

function normalizeProvider(value) {
  if (!value || typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (KNOWN_PROVIDERS.has(normalized)) return normalized
  const safe = normalized.replace(/[^a-z0-9_-]/g, '')
  return safe || null
}

function maskKey(key) {
  if (!key || key.length < 4) return null
  return key.slice(-4)
}

export async function GET() {
  try {
    const userId = await requireUserId()

    const rows = await db
      .select({ provider: providerKeys.provider, apiKey: providerKeys.apiKey, updatedAt: providerKeys.updatedAt })
      .from(providerKeys)
      .where(eq(providerKeys.userId, userId))

    const providers = rows.map((row) => ({
      provider: row.provider,
      connected: true,
      updatedAt: row.updatedAt,
      lastFour: maskKey(row.apiKey),
    }))

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Failed to load provider keys:', error)
    return NextResponse.json({ error: error.message || 'Unable to load provider credentials' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const provider = normalizeProvider(body?.provider)
    const apiKey = body?.apiKey?.trim()

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const result = await db.insert(providerKeys)
      .values({ userId, provider, apiKey })
      .onConflictDoUpdate({
        target: [providerKeys.userId, providerKeys.provider],
        set: { apiKey, updatedAt: new Date() },
      })
      .returning({ provider: providerKeys.provider, updatedAt: providerKeys.updatedAt })

    return NextResponse.json({
      provider: result[0].provider,
      connected: true,
      updatedAt: result[0].updatedAt,
      lastFour: maskKey(apiKey),
    })
  } catch (error) {
    console.error('Failed to save provider key:', error)
    return NextResponse.json({ error: error.message || 'Unable to save provider credential' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const provider = normalizeProvider(searchParams.get('provider'))

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    await db.delete(providerKeys).where(and(eq(providerKeys.userId, userId), eq(providerKeys.provider, provider)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete provider key:', error)
    return NextResponse.json({ error: error.message || 'Unable to delete provider credential' }, { status: 500 })
  }
}

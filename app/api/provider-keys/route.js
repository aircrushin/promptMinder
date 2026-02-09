import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { queries } from '@/lib/db/index.js';

const KNOWN_PROVIDERS = new Set(['openai', 'anthropic', 'zhipu', 'custom']);

function normalizeProvider(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (KNOWN_PROVIDERS.has(normalized)) {
    return normalized;
  }
  // Allow custom slugs while avoiding unexpected characters
  const safe = normalized.replace(/[^a-z0-9_-]/g, '');
  return safe || null;
}

function maskKey(key) {
  if (!key || key.length < 4) return null;
  return key.slice(-4);
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const keys = await queries.providerKeys.getByUser(userId);

    const providers =
      keys?.map((row) => ({
        provider: row.provider,
        connected: true,
        updatedAt: row.updatedAt,
        lastFour: maskKey(row.apiKey),
      })) ?? [];

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Failed to load provider keys:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to load provider credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const provider = normalizeProvider(body?.provider);
    const apiKey = body?.apiKey?.trim();

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const result = await queries.providerKeys.upsert(userId, provider, apiKey);

    return NextResponse.json({
      provider: result.provider,
      connected: true,
      updatedAt: result.updatedAt,
      lastFour: maskKey(apiKey),
    });
  } catch (error) {
    console.error('Failed to save provider key:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to save provider credential' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const provider = normalizeProvider(searchParams.get('provider'));

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    const existing = await queries.providerKeys.getByProvider(userId, provider);
    
    if (existing) {
      await queries.providerKeys.delete(existing.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete provider key:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to delete provider credential' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

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
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('provider_keys')
      .select('provider, api_key, updated_at')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const providers =
      data?.map((row) => ({
        provider: row.provider,
        connected: true,
        updatedAt: row.updated_at,
        lastFour: maskKey(row.api_key),
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

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('provider_keys')
      .upsert(
        {
          user_id: userId,
          provider,
          api_key: apiKey,
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select('provider, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      provider: data.provider,
      connected: true,
      updatedAt: data.updated_at,
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

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('provider_keys')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      throw error;
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


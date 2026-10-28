import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/handle-api-error';
import { ApiError } from '@/lib/api-error';
import { readUrlAsText } from '@/lib/url-reader';

const MAX_BODY_BYTES = 16 * 1024;
const readerAttempts = new Map();

function assertReaderRate(request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const current = readerAttempts.get(key);
  if (readerAttempts.size > 5000) {
    const cutoff = now - 60_000;
    for (const [entryKey, entry] of readerAttempts) {
      if (entry.startedAt < cutoff) readerAttempts.delete(entryKey);
    }
  }
  if (!current || now - current.startedAt >= 60_000) {
    readerAttempts.set(key, { startedAt: now, count: 1 });
    return;
  }
  if (current.count >= 20) throw new ApiError(429, 'Too many reader requests', { code: 'RATE_LIMITED' });
  current.count += 1;
}

export async function POST(request) {
  try {
    assertReaderRate(request);
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      throw new ApiError(413, 'Request body is too large', { code: 'BODY_TOO_LARGE' });
    }
    const payload = await request.json().catch(() => {
      throw new ApiError(400, 'Invalid request body', { code: 'INVALID_BODY' });
    });

    const url = payload?.url;
    const result = await readUrlAsText(url);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'Failed to extract readable text');
  }
}

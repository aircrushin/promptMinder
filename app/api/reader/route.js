import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/handle-api-error';
import { ApiError } from '@/lib/api-error';
import { readUrlAsText } from '@/lib/url-reader';

export async function POST(request) {
  try {
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

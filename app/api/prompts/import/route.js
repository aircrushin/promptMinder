import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { convertConversationToPrompt } from '@/lib/conversation-import.js';
import { ApiError } from '@/lib/api-error.js';

export async function POST(request) {
  try {
    await requireUserId(request);

    const payload = await request.json().catch(() => {
      throw new ApiError(400, 'Invalid JSON body');
    });
    const prompt = await convertConversationToPrompt({
      source: payload?.source,
      conversation: payload?.conversation,
      language: payload?.language,
    });

    return NextResponse.json(prompt, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const response = handleApiError(error, 'Unable to import conversation as prompt');
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
}

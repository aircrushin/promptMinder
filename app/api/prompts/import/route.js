import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { convertConversationToPrompt } from '@/lib/conversation-import.js';

export async function POST(request) {
  try {
    await requireUserId();

    const payload = await request.json();
    const prompt = await convertConversationToPrompt({
      source: payload?.source,
      conversation: payload?.conversation,
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return handleApiError(error, 'Unable to import conversation as prompt');
  }
}

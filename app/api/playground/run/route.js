import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireUserId } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Default configuration from environment
const DEFAULT_API_KEY = process.env.OPENAI_COMPAT_API_KEY || '';
const DEFAULT_BASE_URL = process.env.OPENAI_COMPAT_URL || 'https://api.openai.com/v1';
const PROVIDER_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
};

async function getStoredProviderKey(userId, provider) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('provider_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.api_key || null;
}

export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { prompt, settings = {}, stream = true } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const {
      apiKey,
      baseURL,
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 2000,
      topP = 0.7,
      provider = 'openai',
      useStoredKey = false,
    } = settings;

    const normalizedProvider = (provider || 'openai').toLowerCase();
    let finalApiKey = apiKey || DEFAULT_API_KEY;
    let resolvedBaseURL =
      baseURL || PROVIDER_BASE_URLS[normalizedProvider] || DEFAULT_BASE_URL;

    if (useStoredKey) {
      if (normalizedProvider === 'custom') {
        return NextResponse.json(
          { error: 'Stored credentials are only supported for known providers.' },
          { status: 400 }
        );
      }
      const userId = await requireUserId();
      const storedKey = await getStoredProviderKey(userId, normalizedProvider);
      if (!storedKey) {
        return NextResponse.json(
          { error: `No saved API key found for ${normalizedProvider}.` },
          { status: 400 }
        );
      }
      finalApiKey = storedKey;
    }

    if (!finalApiKey) {
      return NextResponse.json(
        { error: 'API Key is required. Please provide an API key in settings.' },
        { status: 400 }
      );
    }

    // Create OpenAI-compatible client
    const openai = new OpenAI({
      apiKey: finalApiKey,
      baseURL: resolvedBaseURL || DEFAULT_BASE_URL,
    });

    // Prepare messages for chat completion
    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Streamed response
    if (stream) {
      const encoder = new TextEncoder();
      const streamBody = new ReadableStream({
        async start(controller) {
          const send = (payload) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

          try {
            const completion = await openai.chat.completions.create({
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              top_p: topP,
              stream: true,
            });

            let fullText = '';
            let finishReason = null;

            for await (const part of completion) {
              const delta = part.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullText += delta;
                send({ type: 'delta', content: delta });
              }
              finishReason = part.choices?.[0]?.finish_reason || finishReason;
            }

            const usage = completion.finalUsage || {};
            const duration = Date.now() - startTime;

            send({
              type: 'final',
              output: fullText,
              usage: {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
              },
              model,
              duration,
              finishReason,
            });
          } catch (error) {
            console.error('Playground run stream error:', error);
            send({
              type: 'error',
              error: error.message || 'An unexpected error occurred',
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamBody, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Fallback to non-streaming for clients that need full response
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
    });

    const duration = Date.now() - startTime;

    // Extract the response
    const output = completion.choices?.[0]?.message?.content || '';
    const usage = completion.usage || {};

    return NextResponse.json({
      output,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      model: completion.model,
      duration,
      finishReason: completion.choices?.[0]?.finish_reason,
    });
  } catch (error) {
    console.error('Playground run error:', error);

    // Handle specific error types
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your API key and try again.' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Model not found. Please check the model name and try again.' },
        { status: 404 }
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Could not connect to the API endpoint. Please check the URL.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


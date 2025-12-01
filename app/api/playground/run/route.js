import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Default configuration from environment
const DEFAULT_API_KEY = process.env.OPENAI_COMPAT_API_KEY || process.env.ZHIPU_API_KEY;
const DEFAULT_BASE_URL = process.env.OPENAI_COMPAT_URL || 'https://api.openai.com/v1';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { prompt, settings = {} } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const {
      apiKey,
      baseURL = DEFAULT_BASE_URL,
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 2000,
      topP = 0.7,
    } = settings;

    const finalApiKey = apiKey || DEFAULT_API_KEY;

    if (!finalApiKey) {
      return NextResponse.json(
        { error: 'API Key is required. Please provide an API key in settings.' },
        { status: 400 }
      );
    }

    // Create OpenAI-compatible client
    const openai = new OpenAI({
      apiKey: finalApiKey,
      baseURL: baseURL || DEFAULT_BASE_URL,
    });

    // Prepare messages for chat completion
    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Execute the completion request
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



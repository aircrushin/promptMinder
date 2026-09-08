import { PROVIDER_BASE_URLS, getStoredProviderKey, runPlaygroundCompletion } from '@/lib/playground-provider';
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db.js'
import { getOpenAIClientConfig } from '@/lib/openai-compat'

const DEFAULT_API_KEY = process.env.OPENAI_COMPAT_API_KEY || ''
const DEFAULT_BASE_URL = process.env.OPENAI_COMPAT_URL || 'https://api.openai.com/v1'
async function handleClaudeStream(anthropic, model, systemPrompt, userPrompt, temperature, maxTokens, topP, startTime, controller, send) {
  try {
    const messages = []
    if (userPrompt) {
      messages.push({ role: 'user', content: userPrompt })
    }

    const streamParams = { model, max_tokens: maxTokens, temperature, top_p: topP, messages }
    if (systemPrompt) {
      streamParams.system = systemPrompt
    }

    const stream = await anthropic.messages.stream(streamParams)

    let fullText = ''
    let usage = null
    let finishReason = null

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const delta = event.delta.text
        fullText += delta
        send({ type: 'delta', content: delta })
      } else if (event.type === 'message_stop') {
        finishReason = 'end_turn'
      } else if (event.type === 'message_delta' && event.usage) {
        usage = event.usage
      }
    }

    const finalMessage = await stream.finalMessage()
    if (finalMessage.usage) {
      usage = finalMessage.usage
    }

    const duration = Date.now() - startTime

    send({
      type: 'final', output: fullText,
      usage: {
        promptTokens: usage?.input_tokens || 0,
        completionTokens: usage?.output_tokens || 0,
        totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
      },
      model, duration, finishReason: finishReason || 'end_turn',
    })
  } catch (error) {
    console.error('Claude stream error:', error)
    send({ type: 'error', error: error.message || 'An unexpected error occurred' })
  } finally {
    controller.close()
  }
}

async function handleOpenAIStream(openai, model, messages, temperature, maxTokens, topP, startTime, controller, send) {
  try {
    const completion = await openai.chat.completions.create({
      model, messages, temperature, max_tokens: maxTokens, top_p: topP, stream: true,
    })

    let fullText = ''
    let finishReason = null

    for await (const part of completion) {
      const delta = part.choices?.[0]?.delta?.content || ''
      if (delta) {
        fullText += delta
        send({ type: 'delta', content: delta })
      }
      finishReason = part.choices?.[0]?.finish_reason || finishReason
    }

    const usage = completion.finalUsage || {}
    const duration = Date.now() - startTime

    send({
      type: 'final', output: fullText,
      usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens },
      model, duration, finishReason,
    })
  } catch (error) {
    console.error('OpenAI stream error:', error)
    send({ type: 'error', error: error.message || 'An unexpected error occurred' })
  } finally {
    controller.close()
  }
}

export async function POST(request) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { prompt, systemPrompt, userPrompt, settings = {}, stream = true } = body

    if (!prompt && !systemPrompt && !userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const {
      apiKey, baseURL, model = 'gpt-3.5-turbo', temperature = 0.7,
      maxTokens = 2000, topP = 0.7, provider = 'openai', useStoredKey = false,
    } = settings

    const normalizedProvider = (provider || 'openai').toLowerCase()
    let finalApiKey = apiKey || DEFAULT_API_KEY
    let resolvedBaseURL = baseURL || PROVIDER_BASE_URLS[normalizedProvider] || DEFAULT_BASE_URL

    if (useStoredKey) {
      if (normalizedProvider === 'custom') {
        return NextResponse.json({ error: 'Stored credentials are only supported for known providers.' }, { status: 400 })
      }
      const userId = await requireUserId(request)
      const storedKey = await getStoredProviderKey(db, userId, normalizedProvider)
      if (!storedKey) {
        return NextResponse.json({ error: `No saved API key found for ${normalizedProvider}.` }, { status: 400 })
      }
      finalApiKey = storedKey
    }

    if (!finalApiKey) {
      return NextResponse.json({ error: 'API Key is required. Please provide an API key in settings.' }, { status: 400 })
    }

    const isClaude = normalizedProvider === 'claude'

    const messages = []
    let systemMessage = systemPrompt
    let userMessage = userPrompt

    if (!isClaude) {
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
      if (userPrompt) messages.push({ role: 'user', content: userPrompt })
      if (prompt && !systemPrompt && !userPrompt) messages.push({ role: 'user', content: prompt })
    } else {
      if (prompt && !systemPrompt && !userPrompt) userMessage = prompt
    }

    if (stream) {
      const encoder = new TextEncoder()
      const streamBody = new ReadableStream({
        async start(controller) {
          const send = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))

          if (isClaude) {
            const anthropic = new Anthropic({ apiKey: finalApiKey })
            await handleClaudeStream(anthropic, model, systemMessage, userMessage, temperature, maxTokens, topP, startTime, controller, send)
          } else {
            const openai = new OpenAI(getOpenAIClientConfig({
              apiKey: finalApiKey,
              baseURL: resolvedBaseURL || DEFAULT_BASE_URL,
              provider: normalizedProvider,
            }))
            await handleOpenAIStream(openai, model, messages, temperature, maxTokens, topP, startTime, controller, send)
          }
        },
      })

      return new Response(streamBody, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
      })
    }

    return NextResponse.json(await runPlaygroundCompletion({
      apiKey: finalApiKey, baseURL: resolvedBaseURL || DEFAULT_BASE_URL,
      provider: normalizedProvider, model, systemPrompt: systemMessage,
      userPrompt: userMessage || (prompt && !systemMessage ? prompt : ''), temperature, maxTokens, topP,
    }));

  } catch (error) {
    console.error('Playground run error:', error)

    if (error.status === 401) return NextResponse.json({ error: 'Invalid API key. Please check your API key and try again.' }, { status: 401 })
    if (error.status === 429) return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 })
    if (error.status === 404) return NextResponse.json({ error: 'Model not found. Please check the model name and try again.' }, { status: 404 })
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') return NextResponse.json({ error: 'Could not connect to the API endpoint. Please check the URL.' }, { status: 502 })

    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 })
  }
}

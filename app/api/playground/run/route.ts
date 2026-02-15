import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { providerKeys } from '@/drizzle/schema/index'

const DEFAULT_API_KEY = process.env.OPENAI_COMPAT_API_KEY || ''
const DEFAULT_BASE_URL = process.env.OPENAI_COMPAT_URL || 'https://api.openai.com/v1'
const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  claude: 'https://api.anthropic.com/v1',
}

async function getStoredProviderKey(userId: string, provider: string) {
  const rows = await db.select({ apiKey: providerKeys.apiKey })
    .from(providerKeys)
    .where(and(eq(providerKeys.userId, userId), eq(providerKeys.provider, provider)))
    .limit(1)

  return rows[0]?.apiKey || null
}

async function handleClaudeStream(anthropic: any, model: string, systemPrompt: string | undefined, userPrompt: string | undefined, temperature: number, maxTokens: number, topP: number, startTime: number, controller: ReadableStreamDefaultController, send: (payload: any) => void) {
  try {
    const messages = []
    if (userPrompt) {
      messages.push({ role: 'user', content: userPrompt })
    }

    const streamParams: any = { model, max_tokens: maxTokens, temperature, top_p: topP, messages }
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
  } catch (error: any) {
    console.error('Claude stream error:', error)
    send({ type: 'error', error: error.message || 'An unexpected error occurred' })
  } finally {
    controller.close()
  }
}

async function handleOpenAIStream(openai: any, model: string, messages: any[], temperature: number, maxTokens: number, topP: number, startTime: number, controller: ReadableStreamDefaultController, send: (payload: any) => void) {
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

    const usage: any = completion.finalUsage || {}
    const duration = Date.now() - startTime

    send({
      type: 'final', output: fullText,
      usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens },
      model, duration, finishReason,
    })
  } catch (error: any) {
    console.error('OpenAI stream error:', error)
    send({ type: 'error', error: error.message || 'An unexpected error occurred' })
  } finally {
    controller.close()
  }
}

export async function POST(request: Request) {
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
    const resolvedBaseURL = baseURL || PROVIDER_BASE_URLS[normalizedProvider] || DEFAULT_BASE_URL

    if (useStoredKey) {
      if (normalizedProvider === 'custom') {
        return NextResponse.json({ error: 'Stored credentials are only supported for known providers.' }, { status: 400 })
      }
      const userId = await requireUserId()
      const storedKey = await getStoredProviderKey(userId, normalizedProvider)
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
    const systemMessage = systemPrompt
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
          const send = (payload: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))

          if (isClaude) {
            const anthropic = new Anthropic({ apiKey: finalApiKey })
            await handleClaudeStream(anthropic, model, systemMessage, userMessage, temperature, maxTokens, topP, startTime, controller, send)
          } else {
            const openai = new OpenAI({ apiKey: finalApiKey, baseURL: resolvedBaseURL || DEFAULT_BASE_URL })
            await handleOpenAIStream(openai, model, messages, temperature, maxTokens, topP, startTime, controller, send)
          }
        },
      })

      return new Response(streamBody, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
      })
    }

    if (isClaude) {
      const anthropic = new Anthropic({ apiKey: finalApiKey })
      const messageParams: any = {
        model, max_tokens: maxTokens, temperature, top_p: topP,
        messages: [{ role: 'user' as const, content: userMessage }],
      }
      if (systemMessage) messageParams.system = systemMessage

      const response = await anthropic.messages.create(messageParams)
      const duration = Date.now() - startTime
      const output = (response.content?.[0] as any)?.text || ''
      const usage: any = response.usage || {}

      return NextResponse.json({
        output,
        usage: { promptTokens: usage.input_tokens || 0, completionTokens: usage.output_tokens || 0, totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0) },
        model: response.model, duration, finishReason: response.stop_reason,
      })
    } else {
      const openai = new OpenAI({ apiKey: finalApiKey, baseURL: resolvedBaseURL || DEFAULT_BASE_URL })
      const completion = await openai.chat.completions.create({ model, messages, temperature, max_tokens: maxTokens, top_p: topP })
      const duration = Date.now() - startTime
      const output = completion.choices?.[0]?.message?.content || ''
      const usage: any = completion.usage || {}

      return NextResponse.json({
        output,
        usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens },
        model: completion.model, duration, finishReason: completion.choices?.[0]?.finish_reason,
      })
    }
  } catch (error: any) {
    console.error('Playground run error:', error)

    if (error.status === 401) return NextResponse.json({ error: 'Invalid API key. Please check your API key and try again.' }, { status: 401 })
    if (error.status === 429) return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 })
    if (error.status === 404) return NextResponse.json({ error: 'Model not found. Please check the model name and try again.' }, { status: 404 })
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') return NextResponse.json({ error: 'Could not connect to the API endpoint. Please check the URL.' }, { status: 502 })

    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 })
  }
}

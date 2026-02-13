import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const DEFAULT_API_KEY = process.env.ZHIPU_API_KEY;
const DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      messages, 
      apiKey, 
      model = 'glm-4v-flash', 
      systemPrompt, 
      temperature = 0.7,
      max_tokens = 2000,
      top_p = 0.7,
      baseURL = DEFAULT_BASE_URL
    } = body;

    const finalApiKey = apiKey || DEFAULT_API_KEY;
    
    if (!finalApiKey) {
      throw new Error('未提供 API Key');
    }

    // 创建 OpenAI 客户端实例，使用传入的 baseURL
    const openai = new OpenAI({
      apiKey: finalApiKey,
      baseURL: baseURL,
    });
    // 准备发送给 AI 的消息
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ].filter(msg => msg.content);

    // 使用 OpenAI SDK 发送请求
    const completion = await openai.chat.completions.create({
      model: model,
      messages: aiMessages,
      temperature: temperature,
      max_tokens: max_tokens,
      top_p: top_p,
      stream: true
    });

    // 创建一个新的 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            // 获取当前块的内容
            const content = chunk.choices[0]?.delta?.content || '';
            // 打印数据块信息
            console.log('收到数据块:', {
              content: content,
              timestamp: new Date().toISOString(),
              chunkInfo: chunk
            });
            // 将内容编码为 UTF-8
            const bytes = new TextEncoder().encode(content);
            // 将内容推送到流中
            controller.enqueue(bytes);
          }
          controller.close();
        } catch (error) {
          console.error('流处理错误:', error);
          controller.error(error);
        }
      },
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 
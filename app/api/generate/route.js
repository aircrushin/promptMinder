import OpenAI from 'openai';
import { STRUCTURE_PROMPT } from '@/lib/prompts';

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    const openai = new OpenAI({
      apiKey: process.env.ZHIPU_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4'
    });

    const completion = await openai.chat.completions.create({
      model: 'glm-4.5-flash',
      messages: [
        {
          role: "system",
          content: STRUCTURE_PROMPT,
        },
        {
          role: "user",
          content: `Prompt："${text}"`,
        },
      ],
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            const data = `data: ${JSON.stringify({
              choices: [{ delta: { content } }]
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });
  } catch (error) {
    console.error('Error in structure route:', error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

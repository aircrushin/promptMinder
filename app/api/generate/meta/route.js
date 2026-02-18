import { NextResponse } from 'next/server';

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const SYSTEM_PROMPT = `你是一个AI提示词元数据生成助手。根据用户提供的提示词内容，生成一个简洁的标题和简明的描述。
只输出严格的JSON，不包含任何其他内容：
{"title":"标题（不超过25字）","description":"用途描述（不超过60字）"}
如果内容是英文则用英文输出，中文则用中文。只输出JSON。`;

export async function POST(req) {
  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.ZHIPUAI_API_KEY || process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const res = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `提示词内容：\n${content.slice(0, 2000)}` },
        ],
        temperature: 0.3,
        max_tokens: 200,
        thinking: { type: 'disabled' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('ZhipuAI meta error:', err);
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }

    const meta = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: meta.title || '',
      description: meta.description || '',
    });
  } catch (error) {
    console.error('Error in meta generate route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

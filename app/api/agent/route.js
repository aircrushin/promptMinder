const COZE_URL = 'https://6qr4z5p33z.coze.site/stream_run';
const COZE_PROJECT_ID = '7607669951100354600';

export async function POST(request) {
  try {
    const { text, sessionId } = await request.json();

    if (!text || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, sessionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = process.env.COZE_TOKEN || process.env.LANGGRAPH_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'COZE_TOKEN not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = {
      content: {
        query: {
          prompt: [{ type: 'text', content: { text } }],
        },
      },
      type: 'query',
      session_id: sessionId,
      project_id: parseInt(COZE_PROJECT_ID, 10),
    };

    const res = await fetch(COZE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Coze API error:', res.status, errText);
      return new Response(
        JSON.stringify({ error: 'Coze API error', status: res.status, details: errText }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 返回 SSE 流
    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
      },
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

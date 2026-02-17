const LANGGRAPH_URL = 'https://6qr4z5p33z.coze.site/stream_run';
const LANGGRAPH_PROJECT_ID = '7607669951100354600';

export async function POST(request) {
  const { text, sessionId } = await request.json();

  const token = process.env.LANGGRAPH_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'LANGGRAPH_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = {
    content: {
      query: {
        prompt: [{ type: 'text', content: { text } }],
      },
    },
    type: 'query',
    session_id: sessionId,
    project_id: LANGGRAPH_PROJECT_ID,
  };

  const res = await fetch(LANGGRAPH_URL, {
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
    return new Response(errText, { status: res.status });
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

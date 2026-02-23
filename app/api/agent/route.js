const COZE_API_URL = 'https://5kpp3mgcg4.coze.site/stream_run';
const PROJECT_ID = '7609232998323486730';

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = process.env.LANGGRAPH_TOKEN;
    if (!token) {
      console.error('LANGGRAPH_TOKEN is not configured');
      return new Response(JSON.stringify({ error: 'API token not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cozeResponse = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: 'text',
                content: { text: message.trim() },
              },
            ],
          },
        },
        type: 'query',
        session_id: sessionId || '_9dLR7iIq5pV41oCih350',
        project_id: PROJECT_ID,
      }),
    });

    if (!cozeResponse.ok) {
      const errText = await cozeResponse.text();
      console.error('Coze API error:', cozeResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Upstream API error', details: errText }),
        {
          status: cozeResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!cozeResponse.body) {
      return new Response(JSON.stringify({ error: 'No response body from upstream' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pipe the upstream SSE stream directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = cozeResponse.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
      cancel() {
        cozeResponse.body.cancel();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Agent route error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

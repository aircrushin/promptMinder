/**
 * Custom ChatTransport for Coze SSE API
 */

export function createCozeTransport(sessionId, onToolCall, onStreamEvent) {
  return {
    sendMessages: async ({ messages, abortSignal }) => {
      const lastMessage = messages[messages.length - 1];
      const userText = lastMessage?.parts?.find(p => p.type === 'text')?.text || '';

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, sessionId }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const textId = `text-${Date.now()}`;
      let started = false;
      const pendingToolCalls = new Map();

      const transformStream = new TransformStream({
        start() {},
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const blocks = text.split('\n\n');

          for (const block of blocks) {
            if (!block.trim()) continue;

            const dataLines = block
              .split('\n')
              .filter(line => line.startsWith('data:'))
              .map(line => line.slice(5).trim());

            if (dataLines.length === 0) continue;

            try {
              const parsed = JSON.parse(dataLines.join('\n'));

              if (parsed.type === 'message_start') {
                onStreamEvent?.({ type: 'message_start', data: parsed.content?.message_start });
              } else if (parsed.type === 'answer') {
                const answerText = parsed.content?.answer ?? '';

                if (!started) {
                  started = true;
                  controller.enqueue({ type: 'text-start', id: textId });
                }

                if (answerText) {
                  onStreamEvent?.({ type: 'content_start' });
                  controller.enqueue({
                    type: 'text-delta',
                    id: textId,
                    delta: answerText,
                  });
                }
              } else if (parsed.type === 'message_end') {
                onStreamEvent?.({ type: 'message_end' });
              } else if (parsed.type === 'error') {
                controller.enqueue({
                  type: 'error',
                  errorText: parsed.content?.message || 'Unknown error',
                });
              } else if (parsed.type === 'tool_request') {
                const toolRequest = parsed.content?.tool_request;
                if (toolRequest) {
                  const toolCallId = toolRequest?.tool_call_id;
                  if (pendingToolCalls.has(toolCallId)) {
                    continue;
                  }
                  const toolCall = {
                    id: toolCallId,
                    toolName: toolRequest?.tool_name,
                    parameters: toolRequest?.parameters,
                    isParallel: toolRequest?.is_parallel,
                    index: toolRequest?.index,
                    status: 'pending',
                  };
                  pendingToolCalls.set(toolCall.id, toolCall);
                  onToolCall?.({ type: 'request', toolCall });
                }
              } else if (parsed.type === 'tool_response') {
                const toolResponse = parsed.content?.tool_response;
                if (toolResponse) {
                  const toolCallId = toolResponse?.tool_call_id;
                  const pendingCall = pendingToolCalls.get(toolCallId);
                  if (!pendingCall) {
                    continue;
                  }
                  const toolResult = {
                    id: toolCallId,
                    code: toolResponse?.code,
                    message: toolResponse?.message,
                    result: toolResponse?.result,
                    timeCost: toolResponse?.time_cost_ms,
                    toolName: pendingCall?.toolName || toolResponse?.tool_name,
                    status: 'success',
                  };
                  pendingToolCalls.delete(toolCallId);
                  onToolCall?.({ type: 'response', toolResult });
                }
              }
            } catch {
              // Ignore non-JSON blocks
            }
          }
        },
        flush(controller) {
          if (started) {
            controller.enqueue({ type: 'text-end', id: textId });
          }
        },
      });

      return response.body.pipeThrough(transformStream);
    },
  };
}

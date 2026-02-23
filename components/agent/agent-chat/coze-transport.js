/**
 * Coze Agent Transport for @ai-sdk/react useChat
 *
 * Implements the ChatTransport interface:
 *   sendMessages()     → ReadableStream<UIMessageChunk>
 *   reconnectToStream() → null (Coze has no resumable streams)
 *
 * Converts Coze SSE event types to AI SDK UIMessageChunk format:
 *   message_start  → fires onStreamEvent callback
 *   answer         → text-start / text-delta chunks
 *   tool_request   → tool-input-available chunk + onToolCall callback
 *   tool_response  → tool-output-available chunk + onToolCall callback
 *   message_end    → fires onStreamEvent callback
 *   error          → error chunk
 */

const AGENT_API_URL = '/api/agent';

/**
 * Generate a random session ID to scope a Coze conversation.
 * Reuse the same ID across multiple turns to maintain context.
 * @returns {string}
 */
function generateSessionId() {
  return '_' + Math.random().toString(36).slice(2, 14);
}

/**
 * Create a ChatTransport for useChat that routes through the Coze agent API.
 *
 * @param {string}   sessionId       Coze session ID (reuse to keep conversation context)
 * @param {function} onToolCall      ({type:'request'|'response', toolCall?, toolResult?}) => void
 * @param {function} onStreamEvent   ({type:'message_start'|'content_start'|'message_end'}) => void
 * @returns {import('ai').ChatTransport}
 */
function createCozeTransport(sessionId, onToolCall, onStreamEvent) {
  return {
    /**
     * Send messages and return an AI SDK UIMessageChunk stream.
     */
    async sendMessages({ messages, abortSignal }) {
      // Extract the last user message text
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      let text = '';

      if (lastUserMsg) {
        if (Array.isArray(lastUserMsg.parts)) {
          text = lastUserMsg.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('');
        } else if (typeof lastUserMsg.content === 'string') {
          text = lastUserMsg.content;
        }
      }

      const response = await fetch(AGENT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
        signal: abortSignal,
      });

      if (!response.ok) {
        let errMsg = `Agent API error: HTTP ${response.status}`;
        try {
          const body = await response.json();
          errMsg = body.error || errMsg;
        } catch {
          // ignore parse failure
        }
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error('No response body from agent API');
      }

      // Stable ID for the single text block this response will produce
      const TEXT_BLOCK_ID = 'coze-text-0';

      return new ReadableStream({
        async start(controller) {
          controller.enqueue({ type: 'start' });

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let textStarted = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              // SSE blocks are separated by blank lines
              const blocks = buffer.split('\n\n');
              buffer = blocks.pop() ?? '';

              for (const block of blocks) {
                if (!block.trim()) continue;

                const dataLines = block
                  .split('\n')
                  .filter((line) => line.startsWith('data:'))
                  .map((line) => line.slice(5).trim());

                if (!dataLines.length) continue;

                let parsed;
                try {
                  parsed = JSON.parse(dataLines.join('\n'));
                } catch {
                  continue;
                }

                const { type, content = {} } = parsed;

                switch (type) {
                  case 'message_start':
                    onStreamEvent?.({ type: 'message_start' });
                    break;

                  case 'answer': {
                    const chunk = content.answer ?? '';
                    if (chunk) {
                      if (!textStarted) {
                        controller.enqueue({ type: 'text-start', id: TEXT_BLOCK_ID });
                        onStreamEvent?.({ type: 'content_start' });
                        textStarted = true;
                      }
                      controller.enqueue({ type: 'text-delta', delta: chunk, id: TEXT_BLOCK_ID });
                    }
                    break;
                  }

                  case 'tool_request':
                    onToolCall?.({
                      type: 'request',
                      toolCall: {
                        id: content.tool_call_id,
                        name: content.tool_name,
                        args: content.parameters,
                      },
                    });
                    controller.enqueue({
                      type: 'tool-input-available',
                      toolCallId: content.tool_call_id,
                      toolName: content.tool_name,
                      input: content.parameters ?? {},
                    });
                    break;

                  case 'tool_response':
                    onToolCall?.({
                      type: 'response',
                      toolResult: {
                        id: content.tool_call_id,
                        result: content.result,
                      },
                    });
                    controller.enqueue({
                      type: 'tool-output-available',
                      toolCallId: content.tool_call_id,
                      output: content.result,
                    });
                    break;

                  case 'message_end':
                    onStreamEvent?.({ type: 'message_end' });
                    break;

                  case 'error':
                    controller.enqueue({
                      type: 'error',
                      errorText: content.error_msg || `Error code ${content.code}`,
                    });
                    break;

                  default:
                    break;
                }
              }
            }
          } catch (err) {
            if (err?.name !== 'AbortError') {
              controller.enqueue({ type: 'error', errorText: err.message || 'Stream error' });
            }
          } finally {
            if (textStarted) {
              controller.enqueue({ type: 'text-end', id: TEXT_BLOCK_ID });
            }
            controller.enqueue({ type: 'finish' });
            controller.close();
          }
        },

        cancel() {
          response.body?.cancel();
        },
      });
    },

    /**
     * Coze does not support stream resumption.
     */
    async reconnectToStream() {
      return null;
    },
  };
}

export { createCozeTransport, generateSessionId };

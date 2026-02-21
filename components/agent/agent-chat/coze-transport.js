/**
 * Custom ChatTransport for Coze SSE API
 * 
 * Coze SSE 格式：
 * event: message
 * data: {"type": "message_start|answer|message_end|error|tool_request|tool_response", ...}
 * 
 * 每个事件包含：
 * - event: 事件类型（固定为 "message"）
 * - data: JSON 对象，包含具体的业务数据
 */

export function createCozeTransport(sessionId, onToolCall, onStreamEvent) {
  return {
    sendMessages: async ({ messages, abortSignal }) => {
      const lastMessage = messages[messages.length - 1];
      const userText = lastMessage?.parts?.find(p => p.type === 'text')?.text || '';

      if (!userText.trim()) {
        throw new Error('Empty message');
      }

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, sessionId }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed (${response.status})`);
      }

      const textId = `text-${Date.now()}`;
      let started = false;
      let finished = false;
      const pendingToolCalls = new Map();

      const transformStream = new TransformStream({
        start() {},
        
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          
          // SSE 格式：按 "\n\n" 分割事件块
          const events = text.split('\n\n');
          
          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;
            
            // 解析 SSE 事件块
            const lines = eventBlock.split('\n');
            let eventType = 'message'; // 默认事件类型
            let dataStr = '';
            
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr += line.slice(5).trim();
              }
            }
            
            if (!dataStr) continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              
              switch (parsed.type) {
                case 'message_start': {
                  onStreamEvent?.({ type: 'message_start', data: parsed.content?.message_start });
                  break;
                }
                
                case 'answer': {
                  const answerText = parsed.content?.answer ?? '';
                  
                  if (!started && answerText) {
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
                  break;
                }
                
                case 'message_end': {
                  const endData = parsed.content?.message_end;
                  
                  if (endData?.code && endData.code !== '0' && endData.code !== 0) {
                    // 有错误
                    if (!started) {
                      started = true;
                      controller.enqueue({ type: 'text-start', id: textId });
                    }
                    controller.enqueue({
                      type: 'error',
                      errorText: endData.message || `Agent error (code: ${endData.code})`,
                    });
                  }
                  
                  // 正常结束，发送 text-end
                  if (started && !finished) {
                    finished = true;
                    controller.enqueue({ type: 'text-end', id: textId });
                  }
                  
                  onStreamEvent?.({ type: 'message_end', data: endData });
                  break;
                }
                
                case 'error': {
                  const errorMsg = parsed.content?.error || parsed.content?.message || 'Unknown error';
                  if (!started) {
                    started = true;
                    controller.enqueue({ type: 'text-start', id: textId });
                  }
                  controller.enqueue({
                    type: 'error',
                    errorText: errorMsg,
                  });
                  break;
                }
                
                case 'tool_request': {
                  const toolRequest = parsed.content?.tool_request;
                  if (toolRequest) {
                    const toolCallId = toolRequest?.tool_call_id || `tool-${Date.now()}`;
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
                  break;
                }
                
                case 'tool_response': {
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
                  break;
                }
                
                default: {
                  // 未知类型，忽略
                  console.log('Unknown event type:', parsed.type);
                }
              }
            } catch (err) {
              // JSON 解析失败，忽略
              console.warn('Failed to parse SSE data:', dataStr, err);
            }
          }
        },
        
        flush(controller) {
          // 确保流正常结束
          if (started && !finished) {
            finished = true;
            controller.enqueue({ type: 'text-end', id: textId });
          }
        },
      });

      return response.body.pipeThrough(transformStream);
    },
  };
}

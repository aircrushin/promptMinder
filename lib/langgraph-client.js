const LANGGRAPH_URL = 'https://6qr4z5p33z.coze.site/stream_run';
const LANGGRAPH_PROJECT_ID = '7607669951100354600';
const LANGGRAPH_TOKEN = process.env.NEXT_PUBLIC_LANGGRAPH_TOKEN || '';

// 事件数据类型
const DATA_TYPES = {
  MESSAGE_START: 'message_start',
  MESSAGE_END: 'message_end',
  ANSWER: 'answer',
  ERROR: 'error',
  TOOL_REQUEST: 'tool_request',
  TOOL_RESPONSE: 'tool_response',
};

class LangGraphClient {
  constructor(options = {}) {
    this.url = options.url || LANGGRAPH_URL;
    this.projectId = options.projectId || LANGGRAPH_PROJECT_ID;
    this.token = options.token || LANGGRAPH_TOKEN;
  }

  /**
   * 发送流式请求，返回 AsyncGenerator 逐块产出解析后的事件
   * @param {string} text - 用户输入文本
   * @param {object} options
   * @param {string} [options.sessionId] - 会话 ID（可选，默认自动生成）
   * @param {AbortSignal} [options.signal] - 取消信号
   * @returns {AsyncGenerator<{event: string, data: object}>}
   */
  async *stream(text, options = {}) {
    const { sessionId, signal } = options;

    const body = {
      content: {
        query: {
          prompt: [{ type: 'text', content: { text } }],
        },
      },
      type: 'query',
      session_id: sessionId || this._generateSessionId(),
      project_id: this.projectId,
    };

    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LangGraph request failed (${res.status}): ${errText}`);
    }

    if (!res.body) {
      throw new Error('No response body from LangGraph');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          const parsed = this._parseSSEBlock(block);
          if (parsed) yield parsed;
        }
      }

      // 处理残余 buffer
      if (buffer.trim()) {
        const parsed = this._parseSSEBlock(buffer);
        if (parsed) yield parsed;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 非流式便捷方法：收集所有 answer 片段拼成完整回复
   * @param {string} text
   * @param {object} options
   * @returns {Promise<{answer: string, toolRequests: Array, toolResponses: Array}>}
   */
  async run(text, options = {}) {
    let answer = '';
    const toolRequests = [];
    const toolResponses = [];

    for await (const chunk of this.stream(text, options)) {
      const { data } = chunk;
      if (!data) continue;

      switch (data.type) {
        case DATA_TYPES.ANSWER:
          answer += data.content?.answer ?? '';
          break;
        case DATA_TYPES.TOOL_REQUEST:
          toolRequests.push(data.content?.tool_request);
          break;
        case DATA_TYPES.TOOL_RESPONSE:
          toolResponses.push(data.content?.tool_response);
          break;
        case DATA_TYPES.ERROR:
          throw new Error(`LangGraph error: ${JSON.stringify(data.content)}`);
      }
    }

    return { answer, toolRequests, toolResponses };
  }

  /**
   * 流式请求，通过回调处理各类事件
   * @param {string} text
   * @param {object} callbacks
   * @param {function} [callbacks.onAnswer] - 收到 answer 片段时回调
   * @param {function} [callbacks.onToolRequest] - 收到工具调用请求时回调
   * @param {function} [callbacks.onToolResponse] - 收到工具调用结果时回调
   * @param {function} [callbacks.onMessageStart] - 消息开始时回调
   * @param {function} [callbacks.onMessageEnd] - 消息结束时回调
   * @param {function} [callbacks.onError] - 收到错误事件时回调
   * @param {object} [options]
   */
  async streamWithCallbacks(text, callbacks = {}, options = {}) {
    for await (const chunk of this.stream(text, options)) {
      const { data } = chunk;
      if (!data) continue;

      switch (data.type) {
        case DATA_TYPES.ANSWER:
          callbacks.onAnswer?.(data.content?.answer ?? '');
          break;
        case DATA_TYPES.TOOL_REQUEST:
          callbacks.onToolRequest?.(data.content?.tool_request);
          break;
        case DATA_TYPES.TOOL_RESPONSE:
          callbacks.onToolResponse?.(data.content?.tool_response);
          break;
        case DATA_TYPES.MESSAGE_START:
          callbacks.onMessageStart?.(data.content);
          break;
        case DATA_TYPES.MESSAGE_END:
          callbacks.onMessageEnd?.(data.content);
          break;
        case DATA_TYPES.ERROR:
          callbacks.onError?.(data.content);
          break;
      }
    }
  }

  /** 解析单个 SSE block */
  _parseSSEBlock(block) {
    const eventLine = block.split('\n').find(l => l.startsWith('event:'));
    const dataLines = block
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim());

    if (dataLines.length === 0) return null;

    const event = eventLine ? eventLine.slice(6).trim() : 'message';
    const dataText = dataLines.join('\n');

    try {
      return { event, data: JSON.parse(dataText) };
    } catch {
      return { event, data: dataText };
    }
  }

  _generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const langgraphClient = new LangGraphClient();
export { LangGraphClient, DATA_TYPES };

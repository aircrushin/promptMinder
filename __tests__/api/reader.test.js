/**
 * @jest-environment node
 */

if (typeof Response.json !== 'function') {
  Response.json = function(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  };
}

import { POST } from '@/app/api/reader/route';

describe('POST /api/reader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('应该成功返回提取后的文本内容', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: () => '2048',
      },
      text: jest.fn().mockResolvedValue('hello world'),
    });

    const request = new Request('http://localhost/api/reader', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com/article',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sourceUrl).toBe('https://example.com/article');
    expect(data.jinaUrl).toBe('https://r.jina.ai/https://example.com/article');
    expect(data.content).toBe('hello world');
  });

  it('应该拒绝非法地址', async () => {
    const request = new Request('http://localhost/api/reader', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/private',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('BLOCKED_HOST');
  });

  it('应该在上游抓取失败时返回错误码', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 451,
      headers: {
        get: () => null,
      },
      text: jest.fn(),
    });

    const request = new Request('http://localhost/api/reader', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com/unavailable',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.code).toBe('UPSTREAM_FETCH_FAILED');
  });
});

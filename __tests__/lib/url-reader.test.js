/**
 * @jest-environment node
 */

import { ApiError } from '@/lib/api-error';
import {
  buildJinaReaderUrl,
  normalizeUrlForReading,
  readUrlAsText,
} from '@/lib/url-reader';

describe('url-reader', () => {
  describe('normalizeUrlForReading', () => {
    it('应该为缺少协议的地址自动补全 https', () => {
      const url = normalizeUrlForReading('example.com/docs');

      expect(url.href).toBe('https://example.com/docs');
    });

    it('应该拒绝本地或私有网络地址', () => {
      expect(() => normalizeUrlForReading('http://localhost:3000')).toThrow(ApiError);

      try {
        normalizeUrlForReading('http://127.0.0.1:3000');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(400);
        expect(error.details.code).toBe('BLOCKED_HOST');
      }
    });
  });

  describe('buildJinaReaderUrl', () => {
    it('应该生成与 llm-readify 相同格式的 Jina Reader 地址', () => {
      const target = new URL('https://example.com/article');

      expect(buildJinaReaderUrl(target)).toBe('https://r.jina.ai/https://example.com/article');
    });
  });

  describe('readUrlAsText', () => {
    it('应该抓取并清洗返回的纯文本内容', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name) => (name === 'content-length' ? '1024' : null),
        },
        text: jest.fn().mockResolvedValue('title\r\n\r\ncontent'),
      });

      const result = await readUrlAsText('https://example.com/post', {
        fetchImpl: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://r.jina.ai/https://example.com/post',
        expect.objectContaining({
          headers: expect.objectContaining({
            accept: expect.stringContaining('text/plain'),
          }),
        })
      );
      expect(result).toEqual({
        sourceUrl: 'https://example.com/post',
        jinaUrl: 'https://r.jina.ai/https://example.com/post',
        content: 'title\n\ncontent',
        truncated: false,
      });
    });

    it('应该在内容过大时拒绝返回', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name) => (name === 'content-length' ? '5000001' : null),
        },
        text: jest.fn(),
      });

      await expect(
        readUrlAsText('https://example.com/huge', {
          fetchImpl: mockFetch,
        })
      ).rejects.toMatchObject({
        status: 413,
        details: {
          code: 'CONTENT_TOO_LARGE',
        },
      });
    });
  });
});

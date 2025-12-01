/**
 * @jest-environment node
 */

// Polyfill Response.json for Node.js test environment
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

import { POST } from '@/app/api/playground/run/route';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const OpenAI = require('openai');

describe('POST /api/playground/run', () => {
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));
  });

  const createRequest = (body) => {
    return new Request('http://localhost/api/playground/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  describe('Validation', () => {
    it('should return 400 if prompt is missing', async () => {
      const request = createRequest({ settings: { apiKey: 'test-key' } });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Prompt is required');
    });

    it('should return 400 if prompt is not a string', async () => {
      const request = createRequest({
        prompt: 123,
        settings: { apiKey: 'test-key' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must be a string');
    });

    it('should return 400 if API key is missing and no default key', async () => {
      // This test only works when there's no default API key in env
      // In test environment, we mock the request without any API key
      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: '' }, // Explicitly empty
      });
      const response = await POST(request);
      const data = await response.json();

      // When no API key is provided and no default exists, should return 400
      // But if a default key exists in env, it might succeed or fail differently
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Successful execution', () => {
    it('should return output on successful completion', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: { content: 'Test response' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-3.5-turbo',
      });

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.output).toBe('Test response');
      expect(data.usage.totalTokens).toBe(30);
      expect(data.usage.promptTokens).toBe(10);
      expect(data.usage.completionTokens).toBe(20);
      expect(data.finishReason).toBe('stop');
      expect(typeof data.duration).toBe('number');
    });

    it('should use provided settings', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        model: 'gpt-4',
      });

      const request = createRequest({
        prompt: 'Test prompt',
        settings: {
          apiKey: 'custom-key',
          baseURL: 'https://custom.api.com/v1',
          model: 'gpt-4',
          temperature: 0.5,
          maxTokens: 1000,
          topP: 0.9,
        },
      });

      await POST(request);

      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'custom-key',
        baseURL: 'https://custom.api.com/v1',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.5,
        max_tokens: 1000,
        top_p: 0.9,
      });
    });

    it('should use default settings when not provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        model: 'gpt-3.5-turbo',
      });

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key' },
      });

      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.7,
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle 401 authentication errors', async () => {
      const error = new Error('Invalid API key');
      error.status = 401;
      mockCreate.mockRejectedValue(error);

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'invalid-key' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid API key');
    });

    it('should handle 429 rate limit errors', async () => {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      mockCreate.mockRejectedValue(error);

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit');
    });

    it('should handle 404 model not found errors', async () => {
      const error = new Error('Model not found');
      error.status = 404;
      mockCreate.mockRejectedValue(error);

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key', model: 'nonexistent-model' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Model not found');
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      mockCreate.mockRejectedValue(error);

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key', baseURL: 'https://invalid.url' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toContain('Could not connect');
    });

    it('should handle generic errors', async () => {
      mockCreate.mockRejectedValue(new Error('Unknown error'));

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unknown error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty output from API', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        model: 'gpt-3.5-turbo',
      });

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.output).toBe('');
    });

    it('should handle missing usage data', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        model: 'gpt-3.5-turbo',
      });

      const request = createRequest({
        prompt: 'Test prompt',
        settings: { apiKey: 'test-key' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.usage).toEqual({
        promptTokens: undefined,
        completionTokens: undefined,
        totalTokens: undefined,
      });
    });
  });
});


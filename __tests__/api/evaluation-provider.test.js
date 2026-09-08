/** @jest-environment node */
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { runPlaygroundCompletion } from '@/lib/playground-provider';
const mockOpenAI = jest.fn(), mockClaude = jest.fn();
jest.mock('openai', () => jest.fn());
jest.mock('@anthropic-ai/sdk', () => jest.fn());
const config = { apiKey: 'secret', provider: 'openai', model: 'gpt-4.1-mini', systemPrompt: 'System', userPrompt: 'Input', maxTokens: 100 };

it('应该传递标准计费选项并将未知用量保留为空值', async () => {
  OpenAI.mockImplementation(() => ({ chat: { completions: { create: mockOpenAI } } }));
  mockOpenAI.mockResolvedValue({ choices: [{ message: { content: 'Output' }, finish_reason: 'stop' }], model: config.model });
  const result = await runPlaygroundCompletion({ ...config, standardTier: true });
  expect(mockOpenAI.mock.calls[0][0]).toMatchObject({ service_tier: 'default', messages: [{ role: 'system', content: 'System' }, { role: 'user', content: 'Input' }] });
  expect(result.usage).toEqual({ promptTokens: null, completionTokens: null, totalTokens: null, cachedTokens: null });
  expect(result.finishReason).toBe('stop');
});
it('应该合并 Claude 文本块并保留结束原因和真实用量', async () => {
  Anthropic.mockImplementation(() => ({ messages: { create: mockClaude } }));
  mockClaude.mockResolvedValue({ content: [{ type: 'text', text: 'A' }, { type: 'tool_use', name: 'unused' }, { type: 'text', text: 'B' }], usage: { input_tokens: 4, output_tokens: 2, cache_read_input_tokens: 100, cache_creation_input_tokens: 25 }, stop_reason: 'max_tokens', model: 'claude-test' });
  const result = await runPlaygroundCompletion({ ...config, provider: 'claude' });
  expect(result).toMatchObject({ output: 'AB', finishReason: 'max_tokens', usage: { promptTokens: 129, uncachedPromptTokens: 4, completionTokens: 2, totalTokens: 131, cachedTokens: 100, cacheCreationTokens: 25 } });
});

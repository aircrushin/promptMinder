/** @jest-environment node */
import { POST } from '@/app/api/prompts/import/route';
import { requireUserId } from '@/lib/auth';
import { convertConversationToPrompt } from '@/lib/conversation-import';
import { ApiError } from '@/lib/api-error';

jest.mock('@/lib/auth', () => ({ requireUserId: jest.fn() }));
jest.mock('@/lib/conversation-import', () => ({ convertConversationToPrompt: jest.fn() }));

describe('对话提炼 API', () => {
  beforeEach(() => jest.clearAllMocks());
  it('应该鉴权后返回不可缓存的草稿，不执行保存操作', async () => {
    requireUserId.mockResolvedValue('user-id');
    convertConversationToPrompt.mockResolvedValue({ title: 'Draft', mode: 'ai' });
    const request = new Request('http://localhost/api/prompts/import', { method: 'POST', body: JSON.stringify({ conversation: 'A sufficiently long conversation', source: 'claude', language: 'en' }) });
    const response = await POST(request);
    expect(requireUserId).toHaveBeenCalledWith(request);
    expect(convertConversationToPrompt).toHaveBeenCalledWith({ conversation: 'A sufficiently long conversation', source: 'claude', language: 'en' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ title: 'Draft' });
  });
  it('未登录时不得调用提炼模型', async () => {
    requireUserId.mockRejectedValue(new ApiError(401, 'Authentication required'));
    const response = await POST(new Request('http://localhost/api/prompts/import', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(401);
    expect(convertConversationToPrompt).not.toHaveBeenCalled();
  });
  it('无效 JSON 应该返回 400 而不记录对话片段', async () => {
    requireUserId.mockResolvedValue('user-id');
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await POST(new Request('http://localhost/api/prompts/import', { method: 'POST', body: '{private transcript' }));
    expect(response.status).toBe(400);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

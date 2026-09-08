/** @jest-environment node */
import { convertConversationToPrompt } from '@/lib/conversation-import';
import { formatConversationMethod } from '@/lib/conversation-method';

describe('对话方法提炼', () => {
  const originalKey = process.env.ZHIPU_API_KEY;
  const originalAlternate = process.env.ZHIPUAI_API_KEY;
  beforeEach(() => {
    delete process.env.ZHIPUAI_API_KEY;
    process.env.ZHIPU_API_KEY = 'test-key';
    global.fetch = jest.fn();
  });
  afterAll(() => {
    if (originalKey === undefined) delete process.env.ZHIPU_API_KEY;
    else process.env.ZHIPU_API_KEY = originalKey;
    if (originalAlternate === undefined) delete process.env.ZHIPUAI_API_KEY;
    else process.env.ZHIPUAI_API_KEY = originalAlternate;
  });

  it('应该保留长对话开头和最后纠正并明确返回省略标记', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({
      title: '写作方法', description: '用于写作', method: {
        goal: '写一篇 {{topic}} 文章', steps: '先列大纲', corrections: '最终不使用表格', example: '',
      },
    }) } }] }) });
    const conversation = `User: 帮我写产品介绍\nAssistant: ${'背景'.repeat(14000)}\nUser: 最终不要表格，只要两段文字。`;
    const result = await convertConversationToPrompt({ source: 'claude', conversation });
    const sent = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sent.messages[1].content).toContain('帮我写产品介绍');
    expect(sent.messages[1].content).toContain('最终不要表格，只要两段文字。');
    expect(sent.messages[1].content).toContain('Middle omitted');
    expect(sent.messages[0].content).toContain('Never reproduce secrets');
    expect(result).toMatchObject({ mode: 'ai', truncated: true });
    expect(result.content).toContain('{{topic}}');
    expect(result.content).toContain('最终不使用表格');
  });

  it('模型不可用时应该保留初始任务并标为手动草稿，不能把最后一句当作任务', async () => {
    delete process.env.ZHIPU_API_KEY;
    const result = await convertConversationToPrompt({
      source: 'chatgpt', language: 'en',
      conversation: 'User: Write a product launch article.\nAssistant: Sample output.\nUser: Looks good.',
    });
    expect(result.mode).toBe('manual');
    expect(result.method.goal).toBe('Write a product launch article.');
    expect(result.method.steps).toBe('');
    expect(result.method.example).toBe('');
    expect(result.content).not.toContain('Sample output');
    expect(result.content).toContain('## Goal');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('无效模型结构应该降级，未勾选的示例与约束不得写入保存内容', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '{"method":{"goal":{}}}' } }] }) });
    const result = await convertConversationToPrompt({ conversation: 'User: 请写一份可以重复使用的产品需求评审方法。' });
    expect(result.mode).toBe('manual');
    const content = formatConversationMethod({ goal: '目标', steps: '方法', corrections: '本次例外', example: '私人示例' }, 'zh', { corrections: false, example: false });
    expect(content).toContain('方法');
    expect(content).not.toMatch(/本次例外|私人示例/);
  });

  it('应该在调用模型前拒绝非文本、过长对话和未知来源', async () => {
    for (const payload of [{ conversation: {} }, { conversation: 'x'.repeat(50001) }, { conversation: 'x'.repeat(20), source: 'unknown' }]) {
      await expect(convertConversationToPrompt(payload)).rejects.toMatchObject({ status: 400 });
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});

import { normalizeSuite, renderEvaluationPrompt, checkEvaluationOutput, estimateEvaluationCost } from '@/lib/prompt-evaluation';

const suite = { name: 'Regression', cases: [{ name: 'Chinese output', input: '介绍产品', variables: { productName: 'PromptMinder' }, criteria: '表达清晰', checks: [] }] };
const result = { output: '{"ok":true}', finishReason: 'stop', model: 'gpt-4.1-mini-2025-04-14', serviceTier: 'default', usage: { promptTokens: 1000, completionTokens: 100, cachedTokens: 200 } };

describe('版本评测的验收规则与成本', () => {
  it('应该保留大小写变量及人工标准，并在运行前拒绝缺失变量', () => {
    const normalized = normalizeSuite(suite);
    expect(normalized.cases[0].variables).toEqual({ productName: 'PromptMinder' });
    expect(renderEvaluationPrompt('推荐 {{productName}}', normalized.cases[0].variables)).toBe('推荐 PromptMinder');
    expect(() => renderEvaluationPrompt('{{toString}}', {})).toThrow('Missing variable');
    expect(renderEvaluationPrompt('{{productName}}', { productName: '$&' })).toBe('$&');
  });
  it('应该拒绝超限数据、无标准用例、非字符串变量和不支持的规则', () => {
    const item = suite.cases[0];
    for (const cases of [[], Array(6).fill(item), [{ ...item, criteria: '' }], [{ ...item, variables: { a: 3 } }], [{ ...item, checks: [{ type: 'regex', value: '.*' }] }], [{ ...item, checks: [{ type: 'max_chars', value: 0 }] }]]) {
      expect(() => normalizeSuite({ ...suite, cases })).toThrow();
    }
    expect(() => renderEvaluationPrompt('{{x}}{{x}}{{x}}', { x: 'a'.repeat(16000) })).toThrow();
  });
  it('应该区分请求成功、检查失败、未评分与截断输出', () => {
    expect(checkEvaluationOutput({ ...result, output: '' }, [{ type: 'not_contains', value: 'bad' }]).status).toBe('incomplete');
    expect(checkEvaluationOutput(result, []).status).toBe('unscored');
    const checks = [{ type: 'json' }, { type: 'contains', value: 'ok' }, { type: 'not_contains', value: 'secret' }, { type: 'equals', value: result.output }, { type: 'max_chars', value: 30 }];
    expect(checkEvaluationOutput(result, checks).status).toBe('passed');
    expect(checkEvaluationOutput({ ...result, output: '```json\n{}\n```' }, [{ type: 'json' }]).status).toBe('failed');
    expect(checkEvaluationOutput({ ...result, output: '🙂' }, [{ type: 'max_chars', value: 1 }]).status).toBe('passed');
    for (const finishReason of ['length', 'max_tokens', 'tool_calls', 'content_filter', 'refusal', null]) {
      expect(checkEvaluationOutput({ ...result, finishReason }, checks)).toEqual({ status: 'incomplete', checks: [] });
    }
  });
  it('应该使用缓存价格并保留来源，未知用量或模型不能显示为零成本', () => {
    expect(estimateEvaluationCost('openai', result).usd).toBeCloseTo(0.0005);
    expect(estimateEvaluationCost('openai', result).source).toMatch(/^https:\/\/openai.com\//);
    for (const override of [{ model: 'unpriced-model' }, { serviceTier: 'flex' }, { usage: { ...result.usage, cachedTokens: null } }, { usage: { ...result.usage, cachedTokens: 1001 } }]) {
      expect(estimateEvaluationCost('openai', { ...result, ...override })).toBeNull();
    }
    expect(estimateEvaluationCost('orcarouter', result)).toBeNull();
  });
});

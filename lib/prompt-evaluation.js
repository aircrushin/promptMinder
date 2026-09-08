import { assert } from '@/lib/api-error';
import { extractVariables, replaceVariables } from '@/lib/promptVariables';

export const EVALUATION_PROVIDERS = ['openai', 'claude', 'deepseek', 'qwen', 'gemini', 'zhipu', 'kimi', 'doubao', 'minimax', 'siliconflow', 'stepfun', 'xai', 'orcarouter'];

export function evaluationId(value) {
  assert(typeof value === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value), 400, 'Invalid identifier');
  return value;
}

function text(value, max, required = false) {
  assert(typeof value === 'string' && value.length <= max && (!required || value.trim()), 400, 'Invalid or oversized text');
  return value;
}

export function normalizeSuite(body) {
  const name = text(body.name, 200, true).trim();
  assert(Array.isArray(body.cases) && body.cases.length > 0 && body.cases.length <= 5, 400, 'Use 1–5 test cases');
  assert(JSON.stringify(body.cases).length <= 100000, 400, 'Test suite is too large');
  const cases = body.cases.map((item, index) => {
    assert(item && typeof item === 'object', 400, 'Invalid test case');
    const variables = item.variables ?? {};
    assert(variables && typeof variables === 'object' && !Array.isArray(variables) && Object.keys(variables).length <= 30, 400, 'Invalid variables');
    const entries = Object.entries(variables).map(([key, value]) => [text(key, 64, true), text(value, 16000)]);
    assert(Array.isArray(item.checks) && item.checks.length <= 10, 400, 'Use at most 10 checks');
    const checks = item.checks.map((check) => {
      assert(check && ['contains', 'not_contains', 'equals', 'json', 'max_chars'].includes(check.type), 400, 'Invalid check');
      if (check.type === 'json') return { type: 'json' };
      if (check.type === 'max_chars') {
        assert(Number.isSafeInteger(check.value) && check.value > 0 && check.value <= 100000, 400, 'Invalid character limit');
        return { type: check.type, value: check.value };
      }
      return { type: check.type, value: text(check.value, 4000, true) };
    });
    const criteria = text(item.criteria ?? '', 4000);
    assert(checks.length || criteria.trim(), 400, 'Add a check or human acceptance criteria');
    return { id: String(index + 1), name: text(item.name, 200, true), input: text(item.input, 16000, true), variables: Object.fromEntries(entries), checks, criteria };
  });
  return { name, cases };
}

export function renderEvaluationPrompt(content, variables) {
  text(content, 32000, true);
  for (const name of extractVariables(content)) {
    assert(Object.hasOwn(variables, name), 400, `Missing variable: ${name}`);
  }
  return text(replaceVariables(content, variables), 40000, true);
}

export function checkEvaluationOutput(result, checks) {
  if (!['stop', 'end_turn'].includes(result.finishReason) || !result.output?.trim()) return { status: 'incomplete', checks: [] };
  const outcomes = checks.map((check) => {
    let passed = false;
    switch (check.type) {
      case 'contains': passed = result.output.includes(check.value); break;
      case 'not_contains': passed = !result.output.includes(check.value); break;
      case 'equals': passed = result.output === check.value; break;
      case 'max_chars': passed = Array.from(result.output).length <= check.value; break;
      case 'json': try { JSON.parse(result.output); passed = true; } catch {} break;
    }
    return { ...check, passed };
  });
  return { status: outcomes.length ? (outcomes.every((item) => item.passed) ? 'passed' : 'failed') : 'unscored', checks: outcomes };
}

export function estimateEvaluationCost(provider, result) {
  const { promptTokens: input, completionTokens: output, cachedTokens: cached } = result.usage || {};
  if (provider !== 'openai' || !['gpt-4.1-mini', 'gpt-4.1-mini-2025-04-14'].includes(result.model) || result.serviceTier !== 'default'
    || ![input, output, cached].every((n) => Number.isSafeInteger(n) && n >= 0) || cached > input) return null;
  return { usd: ((input - cached) * 0.4 + cached * 0.1 + output * 1.6) / 1000000,
    ratesPerMillion: { input: 0.4, cached: 0.1, output: 1.6 },
    source: 'https://openai.com/index/gpt-4-1/', verifiedAt: '2026-09-05', tier: 'standard' };
}

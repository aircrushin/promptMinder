/** @jest-environment node */
import { PgDialect } from 'drizzle-orm/pg-core';
import { GET, POST, PATCH } from '@/app/api/evaluations/route';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { getPromptByScope } from '@/lib/prompt-workflow';
import { getStoredProviderKey, runPlaygroundCompletion } from '@/lib/playground-provider';
import { ApiError } from '@/lib/api-error';
import { createMockDb } from '../helpers/mock-drizzle';

jest.mock('@/lib/auth', () => ({ requireUserId: jest.fn() }));
jest.mock('@/lib/team-request', () => ({ resolveTeamContext: jest.fn() }));
jest.mock('@/lib/prompt-workflow', () => ({ getPromptByScope: jest.fn() }));
jest.mock('@/lib/playground-provider', () => ({ PROVIDER_BASE_URLS: { openai: 'https://api.openai.com/v1' }, getStoredProviderKey: jest.fn(), runPlaygroundCompletion: jest.fn() }));
const id = '11111111-1111-4111-8111-111111111111', nextId = '22222222-2222-4222-8222-222222222222';
const suite = { id, name: 'Suite', cases: [{ name: 'Case', input: '请回答', variables: { productName: 'PM' }, checks: [{ type: 'contains', value: 'PM' }], criteria: '' }] };
const baseline = { id, lineage_id: 'lineage', content: '介绍 {{productName}}', title: 'Example', version: '1' };
const candidate = { ...baseline, id: nextId, content: '简洁介绍 {{productName}}', version: '2' };
const output = { output: 'PM', finishReason: 'stop', model: 'gpt-4.1-mini', usage: { promptTokens: 10, completionTokens: 1, cachedTokens: 0 }, serviceTier: 'default', duration: 1 };
const run = { action: 'run', suiteId: id, baselineId: id, candidateId: nextId, settings: { provider: 'openai', model: 'gpt-4.1-mini', maxTokens: 100 } };
const request = (body, method = 'POST', query = '') => new Request(`http://localhost/api/evaluations${query}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
const query = (db, index = 0) => new PgDialect().sqlToQuery(db.select.mock.results[index].value.where.mock.calls[0][0]);

describe('评测工作区隔离与可追溯报告', () => {
  let db;
  beforeEach(() => {
    jest.resetAllMocks(); db = createMockDb();
    requireUserId.mockResolvedValue('user-a');
    resolveTeamContext.mockResolvedValue({ db, teamId: 'team-a' });
    getPromptByScope.mockResolvedValueOnce(baseline).mockResolvedValueOnce(candidate);
    getStoredProviderKey.mockResolvedValue('secret-key'); runPlaygroundCompletion.mockResolvedValue(output);
  });
  const prepare = () => { db.enqueueSelect([suite]); db.enqueueInsert([{ id }]); db.enqueueUpdate([], [{ id, status: 'completed' }]); };

  it('应该拒绝未登录、非成员及跨团队读取；个人报告必须同时过滤作者', async () => {
    requireUserId.mockRejectedValueOnce(new ApiError(401, 'Authentication required'));
    expect((await GET(request(null, 'GET'))).status).toBe(401);
    resolveTeamContext.mockRejectedValueOnce(new ApiError(403, 'Not a member'));
    expect((await GET(request(null, 'GET'))).status).toBe(403);
    expect(db.select).not.toHaveBeenCalled();
    expect((await GET(request(null, 'GET', `?reportId=${id}`))).status).toBe(404);
    expect(query(db).params).toEqual([id, 'team-a']);
    resolveTeamContext.mockResolvedValue({ db, teamId: null });
    const response = await GET(request(null, 'GET', `?reportId=${id}`));
    expect(response.status).toBe(404); expect(query(db, 1).sql).toContain('"team_id" is null');
    expect(query(db, 1).params).toEqual([id, 'user-a']);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('应该保存校验后的测试集且忽略客户端伪造的团队及作者', async () => {
    db.enqueueInsert([{ ...suite, createdBy: 'user-a' }]);
    expect((await POST(request({ ...suite, action: 'save_suite', teamId: 'team-b', createdBy: 'other' }))).status).toBe(201);
    const saved = db.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(saved).toMatchObject({ teamId: 'team-a', createdBy: 'user-a' });
    expect(saved.cases[0].variables.productName).toBe('PM');
  });
  it('应该先校验全部变量、作用域、模型和用量上限，再调用收费接口', async () => {
    prepare(); getPromptByScope.mockReset().mockResolvedValueOnce(baseline).mockResolvedValueOnce({ ...candidate, content: '{{missing}}' });
    expect((await POST(request(run))).status).toBe(400);
    expect(runPlaygroundCompletion).not.toHaveBeenCalled(); expect(db.insert).not.toHaveBeenCalled();
    expect(getPromptByScope).toHaveBeenCalledWith(db, { promptId: nextId, teamId: 'team-a', userId: 'user-a', versionOf: baseline });
    db.enqueueSelect([suite]);
    expect((await POST(request({ ...run, settings: { ...run.settings, maxTokens: 99999 } }))).status).toBe(400);
    expect(runPlaygroundCompletion).not.toHaveBeenCalled();
  });
  it('应该使用同一输入和配置对比服务端版本，保存快照且不持久化密钥或任意端点', async () => {
    prepare();
    const response = await POST(request({ ...run, content: 'forged', settings: { ...run.settings, apiKey: 'forged-key', baseURL: 'http://attacker' } }));
    expect(response.status).toBe(201);
    expect(runPlaygroundCompletion).toHaveBeenCalledTimes(2);
    expect(runPlaygroundCompletion.mock.calls.map(([arg]) => arg.systemPrompt)).toEqual(['介绍 PM', '简洁介绍 PM']);
    for (const [arg] of runPlaygroundCompletion.mock.calls) expect(arg).toMatchObject({ userPrompt: '请回答', apiKey: 'secret-key', baseURL: 'https://api.openai.com/v1', clientOptions: { timeout: 20000, maxRetries: 0 } });
    const saved = db.update.mock.results[1].value.set.mock.calls[0][0];
    expect(saved.data.baseline.content).toBe(baseline.content); expect(saved.data.baseline.hash).toHaveLength(64);
    expect(saved.data.results[0].candidate.quality.status).toBe('passed');
    expect(JSON.stringify(saved)).not.toMatch(/secret-key|forged-key|attacker/);
    expect(getStoredProviderKey).toHaveBeenCalledWith(db, 'user-a', 'openai');
  });
  it('应该将提供商错误保存为部分完成，并避免将成功请求等同于通过验收', async () => {
    prepare(); runPlaygroundCompletion.mockRejectedValueOnce(new Error('secret-key')).mockResolvedValueOnce({ ...output, finishReason: 'length' });
    expect((await POST(request(run))).status).toBe(201);
    const saved = db.update.mock.results[1].value.set.mock.calls[0][0];
    expect(saved.status).toBe('partial'); expect(saved.data.results[0].baseline.requestStatus).toBe('failed');
    expect(saved.data.results[0].candidate.quality.status).toBe('incomplete');
    expect(JSON.stringify(saved)).not.toContain('secret-key');
  });
  it('应该使用审批单的基准和提案，拒绝伪造候选或跨团队关联', async () => {
    prepare(); db.enqueueSelect([{ id: nextId, basePromptId: id, proposedContent: '审批 {{productName}}', proposedTitle: 'Proposal', proposedVersion: '3' }]);
    expect((await POST(request({ ...run, baselineId: nextId, changeRequestId: nextId }))).status).toBe(201);
    expect(query(db, 1).params).toEqual([nextId, 'team-a']);
    expect(getPromptByScope).toHaveBeenCalledTimes(1);
    expect(getPromptByScope).toHaveBeenCalledWith(db, { promptId: id, teamId: 'team-a', userId: 'user-a' });
    expect(runPlaygroundCompletion.mock.calls[1][0].systemPrompt).toBe('审批 PM');
    expect(db.insert.mock.results[0].value.values.mock.calls[0][0].changeRequestId).toBe(nextId);
    db.enqueueSelect([suite], []);
    expect((await POST(request({ ...run, changeRequestId: nextId }))).status).toBe(404);
  });
  it('应该防止并发评价覆盖，且只能评价完整输出', async () => {
    const completed = { requestStatus: 'succeeded', quality: { status: 'passed' } };
    const report = { id, revision: 2, status: 'completed', reviews: {}, data: { results: [{ caseId: '1', baseline: completed, candidate: completed }] } };
    const body = { reportId: id, revision: 2, caseId: '1', preference: 'candidate', note: '更清晰' };
    db.enqueueSelect([report]); db.enqueueUpdate([{ ...report, revision: 3 }]);
    expect((await PATCH(request(body, 'PATCH'))).status).toBe(200);
    const chain = db.update.mock.results[0].value;
    expect(new PgDialect().sqlToQuery(chain.where.mock.calls[0][0]).params).toEqual([id, 'team-a', 2]);
    expect(chain.set.mock.calls[0][0].reviews['1']).toMatchObject({ preference: 'candidate', userId: 'user-a' });
    db.enqueueSelect([report]);
    expect((await PATCH(request({ ...body, revision: 1 }, 'PATCH'))).status).toBe(409);
    db.enqueueSelect([report]); db.enqueueUpdate([]);
    expect((await PATCH(request(body, 'PATCH'))).status).toBe(409);
    db.enqueueSelect([{ ...report, status: 'running' }]);
    expect((await PATCH(request(body, 'PATCH'))).status).toBe(409);
  });
});

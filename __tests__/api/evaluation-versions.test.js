/** @jest-environment node */
import { PgDialect } from 'drizzle-orm/pg-core';
import { POST } from '@/app/api/evaluations/route';
import { GET as versions } from '@/app/api/prompts/[id]/versions/route';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { getStoredProviderKey, runPlaygroundCompletion } from '@/lib/playground-provider';
import { createMockDb } from '../helpers/mock-drizzle';
jest.mock('@/lib/auth', () => ({ requireUserId: jest.fn() }));
jest.mock('@/lib/team-request', () => ({ resolveTeamContext: jest.fn() }));
jest.mock('@/lib/playground-provider', () => ({ getStoredProviderKey: jest.fn(), runPlaygroundCompletion: jest.fn(), PROVIDER_BASE_URLS: { openai: 'https://api.openai.com/v1' } }));
const id = '11111111-1111-4111-8111-111111111111', next = '22222222-2222-4222-8222-222222222222';
const old = { id, title: 'Renamed prompt', content: 'old', lineageId: id, createdBy: 'u', userId: 'u', teamId: null };
const latest = { ...old, id: next, lineageId: next, content: 'new' };
const suite = { id, name: 'suite', cases: [{ name: 'case', input: 'input', variables: {}, checks: [], criteria: 'good' }] };
const request = () => new Request('http://localhost/api/evaluations', { method: 'POST', body: JSON.stringify({ action: 'run', suiteId: id, baselineId: id, candidateId: next, settings: { provider: 'openai', model: 'gpt-4.1-mini', maxTokens: 100 } }) });
const query = (db, index) => new PgDialect().sqlToQuery(db.select.mock.results[index].value.where.mock.calls[0][0]);
beforeEach(() => { jest.clearAllMocks(); requireUserId.mockResolvedValue('u'); });

it('应允许版本列表返回的个人历史版本参与评测，并保持作者隔离', async () => {
  const db = createMockDb(); resolveTeamContext.mockResolvedValue({ db, teamId: null });
  db.enqueueSelect([old], [latest, old]);
  const response = await versions(new Request(`http://localhost/api/prompts/${id}/versions`), { params: Promise.resolve({ id }) });
  expect((await response.json()).versions.map(row => row.id)).toEqual([next, id]);
  const listScope = query(db, 1);
  db.enqueueSelect([suite], [old], [latest]); db.enqueueInsert([{ id }]); db.enqueueUpdate([], [{ id, status: 'completed' }]);
  getStoredProviderKey.mockResolvedValue('secret');
  runPlaygroundCompletion.mockResolvedValue({ output: 'ok', finishReason: 'stop', usage: {} });
  expect((await POST(request())).status).toBe(201);
  const candidateScope = query(db, 4);
  expect(candidateScope.params).toEqual([next, ...listScope.params]);
  expect(candidateScope.sql).toContain('"team_id" is null');
  expect(candidateScope.params).toEqual([next, 'u', 'u', 'Renamed prompt']);
  expect(runPlaygroundCompletion).toHaveBeenCalledTimes(2);
});

it.each([
  ['个人', null, old, [next, 'u', 'u', 'Renamed prompt']],
  ['团队', 'team-a', { ...old, teamId: 'team-a' }, [next, 'team-a', id]],
  ['Skill', null, { ...old, skillPackage: { files: [] } }, [next, 'u', 'u', id]],
])('%s 应在收费调用前拒绝不属于同一授权版本集合的候选', async (_, teamId, baseline, params) => {
  const db = createMockDb(); resolveTeamContext.mockResolvedValue({ db, teamId });
  db.enqueueSelect([suite], [baseline], []);
  expect((await POST(request())).status).toBe(400);
  expect(query(db, 2).params).toEqual(params);
  expect(runPlaygroundCompletion).not.toHaveBeenCalled();
  expect(db.insert).not.toHaveBeenCalled();
});

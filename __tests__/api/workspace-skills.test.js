/** @jest-environment node */
import { PgDialect } from 'drizzle-orm/pg-core';
import { GET as getSkill } from '@/app/api/workspace-skills/[id]/route';
import { POST as importSkill } from '@/app/api/workspace-skills/route';
import { POST as updatePrompt } from '@/app/api/prompts/[id]/route';
import { POST as copyPrompt } from '@/app/api/prompts/copy/route';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { applyChangeRequestAction, createPromptDirect } from '@/lib/prompt-workflow';
import { prompts, promptChangeRequests } from '@/drizzle/schema';
import { resolveSkillPackage } from '@/lib/skill-package';
import { toSnakeCase } from '@/lib/case-utils';
import { ApiError } from '@/lib/api-error';
import { createMockDb, createTeamServiceMock } from '../helpers/mock-drizzle';
import { unzipSync } from 'fflate';
import { createSkillArchive } from '@/lib/skill-export';

jest.mock('@/lib/auth', () => ({ requireUserId: jest.fn() }));
jest.mock('@/lib/team-request', () => ({ resolveTeamContext: jest.fn() }));
jest.mock('@/lib/skills-catalog', () => ({ getCatalogSkill: jest.fn() }));

const content = '---\nname: review-skill\ndescription: Review method\n---\nUse references/check.md';
const pkg = { format: 1, source: { license: 'MIT', revision: 'abc' }, files: [
  { path: 'SKILL.md', contents: content }, { path: 'references/check.md', contents: 'original' },
  { path: 'assets/binary', encoding: 'base64', contents: 'AP+A' },
] };
const row = { id: '11111111-1111-4111-8111-111111111111', teamId: 'team-a', lineageId: 'lineage-a', title: 'Review', content, skillPackage: resolveSkillPackage({ skill_package: pkg }), version: '1.0.0', createdBy: 'user-a', userId: 'user-a' };
const context = { params: Promise.resolve({ id: row.id }) };
const request = (body, query = '') => new Request('http://localhost/api/workspace-skills/' + row.id + query, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
const insertedValues = (db, table) => db.insert.mock.calls.flatMap(([target], index) => target === table ? db.insert.mock.results[index].value.values.mock.calls.map(([value]) => value) : []);
const query = (db, index = 0) => new PgDialect().sqlToQuery(db.select.mock.results[index].value.where.mock.calls[0][0]);

describe('Skill 权限、审批与不可变版本', () => {
  let db, teamService;
  beforeEach(() => {
    jest.clearAllMocks();
    db = createMockDb();
    teamService = createTeamServiceMock({ requireMembership: jest.fn().mockResolvedValue({ role: 'owner' }) });
    requireUserId.mockResolvedValue('user-a');
    resolveTeamContext.mockResolvedValue({ db, teamId: 'team-a', teamService });
  });

  it('应该按当前工作区过滤私有版本，拒绝另一工作区、无成员身份及未发布草稿', async () => {
    db.enqueueSelect([row]);
    expect((await getSkill(request(), context)).status).toBe(200);
    expect(query(db).params).toEqual([row.id, 'team-a']);
    expect(query(db).sql).toContain('"team_id" =');
    db = createMockDb();
    resolveTeamContext.mockResolvedValue({ db, teamId: 'team-b', teamService });
    expect((await getSkill(request(), context)).status).toBe(404);
    expect(query(db).params).toEqual([row.id, 'team-b']);
    resolveTeamContext.mockResolvedValue({ db, teamId: null, teamService });
    expect((await getSkill(request(), context)).status).toBe(404);
    expect(query(db, 1).sql).toContain('"team_id" is null');
    expect(query(db, 1).params).toEqual([row.id, 'user-a', 'user-a']);
    resolveTeamContext.mockResolvedValue({ db, teamId: 'team-a', teamService });
    teamService.requireMembership.mockRejectedValue(new ApiError(403, 'Not a member'));
    db.select.mockClear();
    expect((await getSkill(request(), context)).status).toBe(403);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('应该拒绝含糊版本标签，要求通过具体 ID 取用', async () => {
    db.enqueueSelect([row], [row, { ...row, id: 'another' }]);
    expect((await getSkill(request(null, '?version=1.0.0'), context)).status).toBe(409);
    expect(query(db, 1).params).toEqual(['team-a', 'lineage-a', '1.0.0']);
  });

  it('关闭审批时修改附件应该新增版本，保持旧版本不变', async () => {
    const next = { ...pkg, files: pkg.files.map((file) => file.path === 'references/check.md' ? { ...file, contents: 'improved' } : file) };
    db.enqueueSelect([row], [{ approvalEnabled: false }], [{ version: '1.0.0' }]);
    db.enqueueInsert([{ ...row, id: 'new-id', version: '1.0.1' }]);
    const response = await updatePrompt(request({ skill_package: next }), context);
    expect(response.status).toBe(201);
    expect((await response.json()).mode).toBe('version_created');
    expect(db.update).not.toHaveBeenCalled();
    expect(insertedValues(db, prompts)[0]).toMatchObject({ version: '1.0.1', content, skillPackage: { files: expect.arrayContaining([{ path: 'references/check.md', contents: 'improved', encoding: 'utf8', executable: false }]) } });
    expect(row.skillPackage.files[1].contents).toBe('original');
  });

  it('成员改进草稿应该包含完整附件，批准后发布相同包且可逐字节导出', async () => {
    teamService.requireMembership.mockResolvedValue({ role: 'member' });
    const othersRow = { ...row, createdBy: 'other', userId: 'other' };
    const proposal = { id: 'review-id', teamId: 'team-a', lineageId: row.lineageId, status: 'pending', proposedTitle: row.title, proposedContent: content, proposedSkillPackage: row.skillPackage, proposedVersion: '1.0.1', submitterUserId: 'user-a' };
    db.enqueueSelect([othersRow], [{ approvalEnabled: true }], [{ version: '1.0.0' }], []);
    db.enqueueInsert([proposal], []);
    const response = await updatePrompt(request({ content }), context);
    expect((await response.json()).mode).toBe('approval_required');
    expect(insertedValues(db, prompts)).toEqual([]);
    const values = insertedValues(db, promptChangeRequests)[0];
    expect(values.proposedSkillPackage).toEqual(row.skillPackage);
    db = createMockDb();
    db.enqueueInsert([{ ...row, version: '1.0.1' }]);
    db.enqueueUpdate([{ ...proposal, status: 'approved' }]);
    await applyChangeRequestAction(db, { request: toSnakeCase(proposal), action: 'approve', actorUserId: 'manager' });
    const published = insertedValues(db, prompts)[0];
    expect(published.skillPackage).toEqual(values.proposedSkillPackage);
    const zip = unzipSync(createSkillArchive({ name: 'review-skill', files: published.skillPackage.files }));
    expect(Buffer.from(zip['review-skill/assets/binary'])).toEqual(Buffer.from([0, 255, 128]));
  });

  it('导入和复制应该私有保存完整文件集合', async () => {
    db.enqueueSelect([{ approvalEnabled: false }], [{ id: row.lineageId }]);
    db.enqueueInsert([row]);
    expect((await importSkill(request({ skill_package: pkg }))).status).toBe(201);
    expect(insertedValues(db, prompts)[0]).toMatchObject({ isPublic: false, skillPackage: row.skillPackage });
    db = createMockDb();
    resolveTeamContext.mockResolvedValue({ db, teamId: 'team-a', teamService });
    db.enqueueSelect([row], [{ approvalEnabled: false }], [{ id: row.lineageId }]);
    db.enqueueInsert([row]);
    expect((await copyPrompt(request({ sourceId: row.id }))).status).toBe(200);
    expect(insertedValues(db, prompts)[0]).toMatchObject({ isPublic: false, skillPackage: row.skillPackage });
  });

  it('应该同步正文与 SKILL.md，拒绝附件消失或非法包', async () => {
    const updated = resolveSkillPackage({ content: content + '\nUpdated' }, toSnakeCase(row));
    expect(updated.files[0].contents).toBe(content + '\nUpdated');
    expect(updated.files.slice(1)).toEqual(row.skillPackage.files.slice(1));
    expect(() => resolveSkillPackage({ skill_package: null }, toSnakeCase(row))).toThrow(/cannot be removed/);
    await expect(createPromptDirect(db, { teamId: 'team-a', userId: 'user-a', lineageId: row.lineageId, data: { title: 'x', content, skill_package: { ...pkg, files: [] } } })).rejects.toThrow();
    expect(db.insert.mock.results[0]?.value.values).not.toHaveBeenCalled();
  });
});

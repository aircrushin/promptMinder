/** @jest-environment node */
import { GET } from '@/app/api/skills/[id]/export/route';
import { getCatalogSkill } from '@/lib/skills-catalog';
import { unzipSync, strFromU8 } from 'fflate';

jest.mock('@/lib/skills-catalog', () => ({ getCatalogSkill: jest.fn() }));

describe('目录 Skill 下载', () => {
  const content = '---\nname: test-skill\ndescription: Test a method\n---\nRun scripts/test.sh.';
  const source = {
    content, files: [{ path: 'SKILL.md', contents: content }, { path: 'scripts/test.sh', contents: '#!/bin/sh\ntrue\n' }],
    licenseSpdx: 'MIT', auditStatus: 'passed', source: 'team/repo', installUrl: 'https://github.com/team/repo', syncedAt: '2026-09-05T00:00:00Z',
  };
  const download = () => GET(new Request('http://localhost/api/skills/id/export'), { params: Promise.resolve({ id: 'id' }) });

  it('200 个文件也应返回真实 ZIP 和来源记录且不允许缓存', async () => {
    getCatalogSkill.mockResolvedValue({ ...source, files: [...source.files, ...Array.from({ length: 198 }, (_, i) => ({ path: `refs/${i}.txt`, contents: 'reference' }))] });
    const response = await download();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    expect(Object.keys(files)).toHaveLength(201);
    expect(strFromU8(files['test-skill/scripts/test.sh'])).toContain('#!/bin/sh');
    expect(JSON.parse(strFromU8(files['test-skill/promptminder-source.json']))).toMatchObject({ source: 'team/repo', license: 'MIT' });
  });

  it('缺失、受限或内容不一致时应该拒绝导出', async () => {
    for (const [skill, status] of [[null, 404], [{ ...source, auditStatus: 'blocked' }, 403], [{ ...source, licenseSpdx: null }, 403], [{ ...source, content: content + 'different' }, 409]]) {
      getCatalogSkill.mockResolvedValue(skill);
      expect((await download()).status).toBe(status);
    }
  });
});

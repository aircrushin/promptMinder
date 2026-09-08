/** @jest-environment node */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { normalizeSkillPackage, mergeSkillFiles, RECEIPT_PATH } = require('../../../packages/promptminder-cli/lib/skill-package');
const { installSkillVersion, readSkillDirectory, handleWorkspaceSkill } = require('../../../packages/promptminder-cli/lib/workspace-skills');

const id = '11111111-1111-4111-8111-111111111111';
const content = '---\nname: team-skill\ndescription: Reuse a method\n---\nRead references/guide.md';
const binary = Buffer.from([0, 255, 128, 13, 10]);
const pkg = normalizeSkillPackage({ format: 1, source: { url: 'https://example.com/repo', license: 'MIT', revision: 'abc' }, files: [
  { path: 'SKILL.md', contents: content }, { path: 'references/guide.md', contents: '\ufeff保留本地方法' },
  { path: 'assets/image.bin', contents: binary.toString('base64'), encoding: 'base64' },
  { path: 'scripts/run.sh', contents: '#!/bin/sh\nexit 0\n', executable: true },
] });
const prompt = { id, version: '1.0.0', content, skill_package: pkg, team_id: 'team-a' };

describe('工作区 Skill 文件安装与版本选择', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'promptminder-skill-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('应该逐字节安装指定快照并保留来源、执行权限，拒绝覆盖', () => {
    const result = installSkillVersion(prompt, root);
    expect(fs.readFileSync(path.join(result.installed, 'assets/image.bin'))).toEqual(binary);
    expect(fs.readFileSync(path.join(result.installed, 'references/guide.md'), 'utf8')).toBe('\ufeff保留本地方法');
    expect(fs.statSync(path.join(result.installed, 'scripts/run.sh')).mode & 0o100).toBe(0o100);
    const receipt = JSON.parse(fs.readFileSync(path.join(result.installed, RECEIPT_PATH)));
    expect(receipt).toMatchObject({ prompt_id: id, version: '1.0.0', team_id: 'team-a', source: pkg.source });
    expect(receipt.sha256['assets/image.bin']).toHaveLength(64);
    expect(readSkillDirectory(result.installed)).toEqual({ ...pkg, files: expect.arrayContaining(pkg.files) });
    expect(() => installSkillVersion({ ...prompt, version: '2.0.0' }, root)).toThrow(/exist/i);
    expect(JSON.parse(fs.readFileSync(path.join(result.installed, RECEIPT_PATH))).version).toBe('1.0.0');
  });

  it('应该在落盘前拒绝路径穿越、目录冲突、非法编码与超限，并拒绝符号链接', () => {
    for (const file of [
      { path: '../escape', contents: 'x' }, { path: '/absolute', contents: 'x' },
      { path: 'skill.md', contents: 'x' }, { path: 'assets', contents: 'x' },
      { path: RECEIPT_PATH, contents: '{}' }, { path: 'invalid', contents: 'ab==', encoding: 'base64' },
      { path: 'large', contents: 'x'.repeat(2 * 1024 * 1024) },
    ]) {
      expect(() => installSkillVersion({ ...prompt, skill_package: { ...pkg, files: [...pkg.files, file] } }, root)).toThrow();
      expect(fs.readdirSync(root)).toEqual([]);
    }
    const result = installSkillVersion(prompt, root);
    fs.symlinkSync('/etc/hosts', path.join(result.installed, 'link'));
    expect(() => readSkillDirectory(result.installed)).toThrow(/regular files/);
  });

  it('应该只合并选中文件并保留未选中的本地修改', () => {
    const upstream = { ...pkg, files: pkg.files.filter((file) => file.path !== 'scripts/run.sh').map((file) => ({ ...file, contents: file.path === 'references/guide.md' ? 'upstream' : file.contents })) };
    const merged = mergeSkillFiles(pkg, upstream, ['scripts/run.sh']);
    expect(merged.files.find((file) => file.path === 'references/guide.md').contents).toBe('\ufeff保留本地方法');
    expect(merged.files.some((file) => file.path === 'scripts/run.sh')).toBe(false);
  });

  it('CLI 应该携带工作区与明确版本，并拒绝响应工作区或版本不符', async () => {
    const request = jest.fn().mockResolvedValue({ prompt });
    const args = { _: ['skill', 'install', id], team: 'team-a', version: '1.0.0', 'out-dir': root };
    await handleWorkspaceSkill(args, {}, request);
    expect(request).toHaveBeenCalledWith({}, expect.objectContaining({ teamId: 'team-a', query: { version: '1.0.0' } }));
    request.mockResolvedValue({ prompt: { ...prompt, team_id: 'team-b' } });
    await expect(handleWorkspaceSkill(args, {}, request)).rejects.toThrow(/different/);
    request.mockResolvedValue({ prompt: { ...prompt, version: '2.0.0' } });
    await expect(handleWorkspaceSkill(args, {}, request)).rejects.toThrow(/different/);
    request.mockResolvedValue({ mode: 'approval_required', change_request: { id } });
    await expect(handleWorkspaceSkill(args, {}, request)).rejects.toThrow();
  });
});

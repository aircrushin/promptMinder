/** @jest-environment node */
import { unzipSync, strFromU8 } from 'fflate';
import { createPromptSkillFiles, createSkillArchive } from '@/lib/skill-export';
import { normalizeSkillPackage } from '@/lib/skill-package';
import { parseSkillFrontmatter } from '@/lib/skills-sync';

describe('Skill ZIP 导出', () => {
  const name = 'writing-review';
  const description = '检查 "引用" 与格式\n用于中文审稿';
  const files = () => createPromptSkillFiles({ name, description, content: '审阅 {{article}}。' });

  it('应该可解压并原样保留多层文件、Unicode、脚本和许可证', () => {
    const source = [...files(),
      { path: 'references/示例.md', contents: '# 参考\n中文示例' },
      { path: 'scripts/check.sh', contents: '#!/bin/sh\nexit 0\n' },
      { path: 'LICENSE', contents: 'MIT license text' },
    ];
    const decoded = unzipSync(createSkillArchive({ name, files: source }));
    expect(Object.keys(decoded)).toHaveLength(4);
    for (const file of source) expect(strFromU8(decoded[`${name}/${file.path}`])).toBe(file.contents);
    expect(parseSkillFrontmatter(strFromU8(decoded[`${name}/SKILL.md`]))).toEqual({ name, description });
  });

  it('应该阻止路径穿越、同名覆盖和文件目录冲突', () => {
    for (const path of ['../outside.txt', '/absolute.txt', 'C:/file', 'scripts\\bad', 'a/../../x', 'SKILL.md', 'skill.md', 'a/./b', 'a./b']) {
      expect(() => createSkillArchive({ name, files: [...files(), { path, contents: 'x' }] })).toThrow();
    }
    expect(() => createSkillArchive({ name, files: [...files(), { path: 'a/b', contents: 'x' }, { path: 'a', contents: 'x' }] })).toThrow(/conflicts/);
  });

  it('应该拒绝无效元数据、缺少正文和超出文件上限', () => {
    expect(() => createPromptSkillFiles({ name: '../bad', description, content: 'x' })).toThrow();
    expect(() => createSkillArchive({ name, files: [{ path: 'notes.md', contents: 'x' }] })).toThrow(/SKILL.md/);
    expect(() => createSkillArchive({ name: 'wrong-name', files: files() })).toThrow(/match/);
    expect(() => createSkillArchive({ name, files: [...files(), { path: 'large.txt', contents: 'x'.repeat(2 * 1024 * 1024 + 1) }] })).toThrow(/limit/);
  });

  it('已有 Skill 正文应该原样导出并保留其他元数据', () => {
    const content = '---\nname: writing-review\ndescription: Review text\nlicense: MIT\n---\nRead references/style.md.';
    const exported = createPromptSkillFiles({ name, description: 'Review text', content });
    expect(exported[0].contents).toBe(content);
  });
});

it('200 个用户文件应可连同内部元数据导出、解压并重新校验，201 个用户文件仍被拒绝', () => {
  const main = { path: 'SKILL.md', contents: '---\nname: full-skill\ndescription: Full package\n---\nBody' };
  const skill = normalizeSkillPackage({ format: 1, files: [main, ...Array.from({ length: 199 }, (_, i) => ({ path: `refs/${i}.txt`, contents: `file ${i}` }))] });
  for (const path of ['.promptminder-install.json', 'promptminder-source.json']) {
    const metadataFile = { path, contents: '{"version":"1.0"}' };
    const decoded = unzipSync(createSkillArchive({ name: 'full-skill', files: skill.files, metadataFile }));
    expect(Object.keys(decoded)).toHaveLength(201);
    expect(strFromU8(decoded[`full-skill/${path}`])).toBe(metadataFile.contents);
    const restored = normalizeSkillPackage({ format: 1, files: skill.files.map(file => ({ ...file, contents: strFromU8(decoded[`full-skill/${file.path}`]) })) });
    expect(restored).toEqual(skill);
  }
  expect(() => createSkillArchive({ name: 'full-skill', files: [...skill.files, { path: 'extra.txt', contents: 'extra' }] })).toThrow('1–200 files');
  expect(() => createSkillArchive({ name: 'full-skill', files: skill.files, metadataFile: { path: '../outside', contents: '' } })).toThrow('metadata');
  expect(() => createSkillArchive({ name: 'full-skill', files: [main, { path: 'promptminder-source.json', contents: 'user file' }], metadataFile: { path: 'promptminder-source.json', contents: '{}' } })).toThrow('Duplicate');
});

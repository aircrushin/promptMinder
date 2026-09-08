import { decodeSkillFile } from '@/lib/skill-package';
import { zipSync } from 'fflate';
import { assert } from '@/lib/api-error';
import { parseSkillFrontmatter } from '@/lib/skills-sync';

export function validateSkillMetadata(name, description) {
  assert(typeof name === 'string' && name.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name),
    400, 'Use a skill name of 1–64 lowercase letters, numbers and single hyphens.');
  assert(typeof description === 'string' && description.trim().length > 0 && description.length <= 1024,
    400, 'A skill description of 1–1024 characters is required.');
}

export function createPromptSkillFiles({ name, description, content }) {
  validateSkillMetadata(name, description);
  assert(typeof content === 'string' && content.trim(), 400, 'Prompt content is required.');
  const existing = parseSkillFrontmatter(content);
  if (existing.name || existing.description) {
    assert(existing.name === name && existing.description === description, 400,
      'Edit existing Skill metadata in the prompt before exporting.');
    return [{ path: 'SKILL.md', contents: content }];
  }
  return [{
    path: 'SKILL.md',
    contents: `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n${content.trim()}\n`,
  }];
}

export function createSkillArchive({ name, files, metadataFile }) {
  assert(Array.isArray(files) && files.length > 0 && files.length <= 200, 400, 'Export supports 1–200 files.');
  assert(!metadataFile || ['.promptminder-install.json', 'promptminder-source.json'].includes(metadataFile.path),
    400, 'Invalid export metadata file.');
  const skill = files.find((file) => file?.path === 'SKILL.md');
  assert(typeof skill?.contents === 'string', 400, 'SKILL.md is required.');
  const metadata = parseSkillFrontmatter(skill?.contents);
  validateSkillMetadata(name, metadata.description);
  assert(metadata.name === name, 400, 'SKILL.md name must match the package directory.');
  const entries = Object.create(null);
  const paths = new Set();
  let totalBytes = 0;
  for (const file of [...files, ...(metadataFile ? [metadataFile] : [])]) {
    assert(typeof file?.path === 'string' && file.path.length <= 240
      && !/[\\:\x00-\x1f\x7f]/.test(file.path)
      && file.path.split('/').every((part) => part && part !== '.' && part !== '..' && !/[. ]$/.test(part)),
    400, 'Unsafe file path in Skill package.');
    assert(typeof file.contents === 'string', 400, 'File contents must be a string.');
    const canonical = file.path.normalize('NFC').toLowerCase();
    assert(!paths.has(canonical), 400, 'Duplicate file path in Skill package.');
    paths.add(canonical);
    let contents;
    try { contents = decodeSkillFile(file); } catch (error) { assert(false, 400, error.message); }
    totalBytes += contents.length;
    assert(contents.length <= 2 * 1024 * 1024 && totalBytes <= 10 * 1024 * 1024,
      400, 'Skill exceeds the export limit (2 MB per file, 10 MB total).');
    entries[`${name}/${file.path}`] = [contents, {
      os: 3,
      attrs: ((file.executable ?? ((!file.encoding || file.encoding === 'utf8') && file.contents.startsWith('#!'))) ? 0o100755 : 0o100644) << 16,
    }];
  }
  for (const path of paths) {
    const parts = path.split('/');
    parts.pop();
    while (parts.length) {
      assert(!paths.has(parts.join('/')), 400, 'A file conflicts with a directory in the Skill package.');
      parts.pop();
    }
  }
  return zipSync(entries);
}

export function downloadSkillArchive(archive, name) {
  const url = URL.createObjectURL(new Blob([archive], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

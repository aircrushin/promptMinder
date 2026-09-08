const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeSkillPackage, decodeSkillFile, parseSkillFrontmatter, MAX_BYTES, MAX_FILES, RECEIPT_PATH } = require('./skill-package');

function readSkillDirectory(directory, source = null) {
  const root = path.resolve(directory);
  const files = [];
  let total = 0;
  let directories = 0;
  function walk(current, prefix = '') {
    if (++directories > MAX_FILES) throw new Error('Too many Skill directories.');
    if (!fs.lstatSync(current).isDirectory()) throw new Error('Skill directories must not be symbolic links.');
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const filePath = path.join(current, entry.name);
      const relativePath = prefix + entry.name;
      if (relativePath === RECEIPT_PATH) {
        if (!entry.isFile() || fs.statSync(filePath).size > MAX_BYTES) throw new Error('Invalid installation receipt.');
        if (!source || !Object.values(source).some(Boolean)) source = JSON.parse(fs.readFileSync(filePath, 'utf8')).source || null;
        continue;
      }
      if (entry.isDirectory()) { walk(filePath, relativePath + '/'); continue; }
      if (!entry.isFile()) throw new Error(`Only regular files are supported: ${relativePath}`);
      total += fs.statSync(filePath).size;
      if (total > MAX_BYTES || files.length >= MAX_FILES) throw new Error('Skill exceeds 200 files or 2 MB.');
      const bytes = fs.readFileSync(filePath);
      const text = bytes.toString('utf8');
      const isText = Buffer.from(text, 'utf8').equals(bytes);
      files.push({ path: relativePath, contents: isText ? text : bytes.toString('base64'), encoding: isText ? 'utf8' : 'base64', executable: Boolean(fs.statSync(filePath).mode & 0o111) });
    }
  }
  walk(root);
  return normalizeSkillPackage({ format: 1, files, source });
}

function installSkillVersion(prompt, targetRoot) {
  if (!prompt?.id || !prompt.skill_package) throw new Error('The server did not return a published Skill version.');
  const skill = normalizeSkillPackage(prompt.skill_package);
  const main = skill.files.find((file) => file.path === 'SKILL.md');
  if (prompt.content !== main.contents) throw new Error('Inconsistent Skill version.');
  const { name } = parseSkillFrontmatter(main.contents);
  fs.mkdirSync(targetRoot, { recursive: true });
  const destination = path.join(fs.realpathSync(targetRoot), name);
  // Exclusive creation prevents overwriting an installed package or following a destination symlink.
  fs.mkdirSync(destination, { mode: 0o700 });
  try {
    const hashes = Object.create(null);
    for (const file of skill.files) {
      const target = path.join(destination, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
      const bytes = decodeSkillFile(file);
      fs.writeFileSync(target, bytes, { flag: 'wx', mode: file.executable ? 0o700 : 0o600 });
      hashes[file.path] = crypto.createHash('sha256').update(bytes).digest('hex');
    }
    fs.writeFileSync(path.join(destination, RECEIPT_PATH), JSON.stringify({
      prompt_id: prompt.id, version: prompt.version, team_id: prompt.team_id || null, source: skill.source, sha256: hashes,
    }, null, 2), { flag: 'wx', mode: 0o600 });
    return { installed: destination, prompt_id: prompt.id, version: prompt.version, files: skill.files.length };
  } catch (error) {
    fs.rmSync(destination, { recursive: true, force: true });
    throw error;
  }
}

async function handleWorkspaceSkill(args, config, requestJson, resolveTargetDir) {
  const action = args._[1];
  const teamId = args.team;
  if (action === 'list') return requestJson(config, { endpoint: '/api/workspace-skills', query: { search: args.search }, teamId });
  if (action === 'import') {
    if (!args._[2]) throw new Error('skill import requires <directory>.');
    const skill = readSkillDirectory(args._[2], { url: args['source-url'], license: args.license, revision: args['source-version'] });
    return requestJson(config, { method: 'POST', endpoint: '/api/workspace-skills', teamId, body: { title: args.title, version: args.version, skill_package: skill } });
  }
  if (!['get', 'install', 'update'].includes(action)) throw new Error('Use skill list|get|import|update|install.');
  const id = args._[2];
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('A Skill prompt UUID is required.');
  if (action === 'update' && !args._[3]) throw new Error('skill update requires <id> <directory>.');
  if (action === 'install' && args.force) throw new Error('Workspace Skill installation never overwrites files; choose a new --out-dir.');
  const response = await requestJson(config, { endpoint: `/api/workspace-skills/${id}`, query: action === 'update' ? null : { version: args.version }, teamId });
  const prompt = response?.prompt;
  if (!prompt?.skill_package || (action !== 'update' && args.version ? prompt.version !== args.version : prompt?.id !== id)
    || (prompt.team_id || null) !== (teamId || null)) throw new Error('The server returned a different Skill version or workspace.');
  if (action === 'get') return response;
  if (action === 'install') return installSkillVersion(prompt, args['out-dir'] || resolveTargetDir(args.target || 'cursor-project'));
  const skill = readSkillDirectory(args._[3], prompt.skill_package.source);
  return requestJson(config, { method: 'POST', endpoint: `/api/prompts/${id}`, teamId, body: { skill_package: skill, version: args.version } });
}

module.exports = { readSkillDirectory, installSkillVersion, handleWorkspaceSkill };

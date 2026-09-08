const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseArgs } = require('./cli');

const CLI_PATH = path.resolve(__dirname, '../bin/promptminder.js');

function fail(message) {
  process.stderr.write(`${JSON.stringify({
    error: {
      message,
    },
  }, null, 2)}\n`);
  process.exit(1);
}

function requireString(value, message) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    fail(message);
  }

  return value.trim();
}

function pushOption(command, key, value) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  command.push(`--${key}`, String(value));
}

function readJsonInput(args) {
  const sources = [
    args.input ? 'inline' : null,
    args['input-file'] ? 'file' : null,
    args.stdin ? 'stdin' : null,
  ].filter(Boolean);

  if (sources.length > 1) {
    fail('Use only one of --input, --input-file, or --stdin');
  }

  if (sources.length === 0) {
    return {};
  }

  let raw = '';

  if (args.input) {
    raw = args.input;
  } else if (args['input-file']) {
    try {
      raw = fs.readFileSync(path.resolve(process.cwd(), args['input-file']), 'utf8');
    } catch (error) {
      fail(`Unable to read input file: ${error.message}`);
    }
  } else {
    if (process.stdin.isTTY) {
      fail('--stdin was set but no stdin stream is available');
    }
    raw = fs.readFileSync(0, 'utf8');
  }

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON input: ${error.message}`);
  }
}

function buildTeamList(input) {
  const command = ['team', 'list'];
  pushOption(command, 'team', input.team);
  return command;
}

function buildPromptList(input) {
  const command = ['prompt', 'list'];
  pushOption(command, 'team', input.team);
  pushOption(command, 'tag', input.tag);
  pushOption(command, 'search', input.search);
  pushOption(command, 'page', input.page);
  pushOption(command, 'limit', input.limit);
  return command;
}

function buildPromptGet(input) {
  const command = ['prompt', 'get', requireString(input.id, 'prompt.get requires "id"')];
  pushOption(command, 'team', input.team);
  return command;
}

function buildPromptCreate(input) {
  const command = ['prompt', 'create', '--title', requireString(input.title, 'prompt.create requires "title"')];
  pushOption(command, 'description', input.description);
  pushOption(command, 'content', requireString(input.content, 'prompt.create requires "content"'));
  pushOption(command, 'tags', input.tags);
  pushOption(command, 'version', input.version);
  pushOption(command, 'team', input.team);
  return command;
}

function buildPromptUpdate(input) {
  const command = ['prompt', 'update', requireString(input.id, 'prompt.update requires "id"')];
  pushOption(command, 'title', input.title);
  pushOption(command, 'description', input.description);
  pushOption(command, 'content', input.content);
  pushOption(command, 'tags', input.tags);
  pushOption(command, 'version', input.version);
  pushOption(command, 'team', input.team);

  if (command.length === 3) {
    fail('prompt.update requires at least one field to change');
  }

  return command;
}

function buildPromptDelete(input) {
  const command = ['prompt', 'delete', requireString(input.id, 'prompt.delete requires "id"'), '--yes'];
  pushOption(command, 'team', input.team);
  return command;
}

function buildTagList(input) {
  const command = ['tag', 'list'];
  pushOption(command, 'team', input.team);
  pushOption(command, 'include-public', input.includePublic);
  return command;
}

function buildTagCreate(input) {
  const command = ['tag', 'create', '--name', requireString(input.name, 'tag.create requires "name"')];
  pushOption(command, 'team', input.team);
  return command;
}

function buildTagUpdate(input) {
  const command = ['tag', 'update', requireString(input.id, 'tag.update requires "id"'), '--name', requireString(input.name, 'tag.update requires "name"')];
  pushOption(command, 'team', input.team);
  return command;
}

function buildTagDelete(input) {
  const command = ['tag', 'delete', requireString(input.id, 'tag.delete requires "id"'), '--yes'];
  pushOption(command, 'team', input.team);
  return command;
}

function buildSkillCommand(action, input) {
  const command = ['skill', action];
  if (['get', 'install', 'update'].includes(action)) command.push(requireString(input.id, `skill.${action} requires "id"`));
  if (['import', 'update'].includes(action)) command.push(requireString(input.directory, `skill.${action} requires "directory"`));
  for (const key of ['team', 'search', 'version', 'title', 'target', 'out-dir', 'source-url', 'license', 'source-version']) pushOption(command, key, input[key]);
  return command;
}

const ACTIONS = {
  ...Object.fromEntries(['list', 'get', 'import', 'update', 'install'].map((action) => [`skill.${action}`, (input) => buildSkillCommand(action, input)])),
  'team.list': buildTeamList,
  'prompt.list': buildPromptList,
  'prompt.get': buildPromptGet,
  'prompt.create': buildPromptCreate,
  'prompt.update': buildPromptUpdate,
  'prompt.delete': buildPromptDelete,
  'tag.list': buildTagList,
  'tag.create': buildTagCreate,
  'tag.update': buildTagUpdate,
  'tag.delete': buildTagDelete,
};

function usage() {
  return [
    'promptminder-agent <action> [--input <json> | --input-file <path> | --stdin]',
    '',
    'Actions:',
    '  skill.list | skill.get | skill.import | skill.update | skill.install',
    '  team.list',
    '  prompt.list',
    '  prompt.get',
    '  prompt.create',
    '  prompt.update',
    '  prompt.delete',
    '  tag.list',
    '  tag.create',
    '  tag.update',
    '  tag.delete',
    '',
    'Examples:',
    '  promptminder-agent prompt.list',
    '  promptminder-agent prompt.get --input "{\\"id\\":\\"prompt-id\\"}"',
    '  cat payload.json | promptminder-agent prompt.create --stdin',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const action = args._[0];

  if (!action || action === 'help' || args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const builder = ACTIONS[action];

  if (!builder) {
    fail(`Unknown action: ${action}`);
  }

  const input = readJsonInput(args);
  const command = builder(input);
  const result = spawnSync(process.execPath, [CLI_PATH, ...command], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    fail(`Unable to execute CLI: ${result.error.message}`);
  }

  process.exit(result.status === null ? 1 : result.status);
}

function runPromptminderAgentCli(argv) {
  main(argv);
}

module.exports = {
  runPromptminderAgentCli,
  usage,
};

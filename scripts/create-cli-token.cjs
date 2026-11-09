#!/usr/bin/env node

const crypto = require('crypto');
const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--') {
      continue;
    }

    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function required(value, message) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(message);
  }
  return value.trim();
}

function createTokenValue() {
  return `pm_${crypto.randomBytes(24).toString('hex')}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const userId = required(args.user, '--user is required');
  const name = required(args.name, '--name is required');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const token = createTokenValue();
  const tokenHash = hashToken(token);
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const rows = await sql`
      insert into cli_tokens ("user_id", "name", "token_hash")
      values (${userId}, ${name}, ${tokenHash})
      returning "id", "user_id", "name", "created_at"
    `;

    const created = rows[0];
    process.stdout.write(`${JSON.stringify({
      token,
      token_id: created.id,
      user_id: created.user_id,
      name: created.name,
      created_at: created.created_at,
    }, null, 2)}\n`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    error: {
      message: error.message,
    },
  }, null, 2)}\n`);
  process.exit(1);
});

#!/usr/bin/env node

const { createClerkClient } = require('@clerk/nextjs/server');
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

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message) {
  printJson({
    error: {
      message,
    },
  }, process.stderr);
  process.exit(1);
}

function resolveEmail(args) {
  if (typeof args.email === 'string' && args.email.trim()) {
    return args.email.trim().toLowerCase();
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 1) {
    return adminEmails[0];
  }

  fail('Missing email. Pass --email <address>.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = resolveEmail(args);
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    fail('CLERK_SECRET_KEY is required.');
  }

  const clerk = createClerkClient({ secretKey });
  const result = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 10,
  });
  const users = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];

  if (users.length === 0) {
    fail(`No Clerk user found for ${email}.`);
  }

  if (users.length > 1) {
    fail(`Multiple Clerk users found for ${email}. Narrow the lookup manually.`);
  }

  const user = users[0];
  printJson({
    user_id: user.id,
    email,
    username: user.username || null,
    full_name: user.fullName || null,
  });
}

main().catch((error) => {
  fail(error.message);
});

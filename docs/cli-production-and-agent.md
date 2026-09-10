# PromptMinder CLI Production Guide

This guide covers production use and AI agent integration. Requires Node.js ≥ 20.

Install or update the public CLI with `npm i -g @aircrushin/promptminder-cli@latest`; inspect the installed version with `npm list -g @aircrushin/promptminder-cli --depth=0`. As of 2026-09-10, npm latest is 0.1.3; repository 0.2.0 workspace Skill commands are not yet published.

## 1. User setup

Create your CLI token in the web app:

```text
https://www.prompt-minder.com/settings/cli-tokens
```

Recommended user flow:

1. Sign in to PromptMinder.
2. Open the CLI token settings page.
3. Create a token with a descriptive name such as `agent-prod` or `cursor-dev`.
4. Copy the plain-text token immediately.
5. Configure `PROMPTMINDER_TOKEN` in the shell where the CLI runs.

## 2. Agent runtime environment

Set this variable in the environment where the AI agent runs:

```bash
export PROMPTMINDER_TOKEN=pm_xxx
```

PowerShell:

```powershell
$env:PROMPTMINDER_TOKEN = "pm_xxx"
```

The CLI is hard-wired to `https://www.prompt-minder.com`. Environment auth is sufficient for production agents; no `auth login` is needed. On a personal machine, local login is an alternative: `promptminder auth login --token pm_xxx` saves the token to `~/.promptminder/config.json`.

Token precedence: `--token` → `PROMPTMINDER_TOKEN` → saved config. An old environment token overrides newly saved login; `auth logout` only removes the saved token.

## 3. Direct CLI usage

Once the environment is configured, the CLI can call the production API directly:

```bash
pnpm cli -- team list
pnpm cli -- prompt list
pnpm cli -- prompt get <promptId>
pnpm cli -- prompt create --title "My Prompt" --content "Hello"
pnpm cli -- tag list
```

For team-scoped operations, pass `--team <teamId>`:

```bash
pnpm cli -- prompt list --team <teamId>
pnpm cli -- prompt create --team <teamId> --title "My Prompt" --content "Hello"
```

## 3.1 Global command mode

This repository already exposes a binary named `promptminder` through the `bin` field.

For local machine usage, link it into your global PATH:

```bash
pnpm cli:link
```

After linking, you can run it directly instead of `pnpm cli --`:

```bash
promptminder help
promptminder team list
promptminder prompt list
promptminder prompt create --title "My Prompt" --content "Hello"
```

If you want to remove the global command later:

```bash
pnpm cli:unlink
```

This gives you a `codex`-style workflow on your own machine. For npm publishing, use the dedicated package below.

## 3.2 Publishable npm package mode

The repository includes a standalone package at [packages/promptminder-cli/package.json](../packages/promptminder-cli/package.json).

It is designed for this workflow:

```bash
npm i -g @aircrushin/promptminder-cli
promptminder help
```

Before publishing:

1. Review the package contents under `packages/promptminder-cli`.
2. Build a local tarball to verify the package shape:

```bash
pnpm cli:pack
```

3. Publish from the package directory:

```bash
cd packages/promptminder-cli
npm publish --access public
```

### npm registry: 403 and two-factor authentication

If publish fails with **403 Forbidden** and a message about **two-factor authentication**, npm is enforcing 2FA for publishes. Fix it on the account that owns the scope:

1. Sign in at [https://www.npmjs.com/](https://www.npmjs.com/) and open **Account** → **Security**.
2. Enable **two-factor authentication** and set the authorization mode to **Authorization and publishing** (or use an automation flow that npm documents for your case).
3. Alternatively, create a **granular access token** with permission to publish to the relevant packages, using the token type npm requires for publishing (including **Bypass two-factor authentication** when you intend CI or non-interactive publishes).

After 2FA or the correct token is in place, run `npm publish` again from `packages/promptminder-cli`.

### `bin` warnings during `npm publish`

Current npm versions may log that the `bin` field was **auto-corrected** during publish. That message is often misleading: the published tarball should still contain `bin` pointing at `bin/promptminder.js` and `bin/promptminder-agent.js`. Confirm with `npm pack` and inspect `package/package.json` inside the archive if you are unsure.

The published package exposes two binaries:

- `promptminder`
- `promptminder-agent`

## 4. Agent-safe wrapper

For AI agents, use the whitelist wrapper instead of giving the model free-form shell access:

```bash
pnpm cli:agent -- prompt.list
pnpm cli:agent -- prompt.get --input '{"id":"prompt-id"}'
pnpm cli:agent -- prompt.create --input '{"title":"My Prompt","content":"Hello"}'
pnpm cli:agent -- prompt.update --input '{"id":"prompt-id","title":"New Title"}'
pnpm cli:agent -- prompt.delete --input '{"id":"prompt-id"}'
pnpm cli:agent -- tag.list
pnpm cli:agent -- tag.create --input '{"name":"marketing"}'
```

The wrapper supports three JSON input modes:

```bash
pnpm cli:agent -- prompt.get --input '{"id":"prompt-id"}'
pnpm cli:agent -- prompt.get --input-file ./payload.json
cat payload.json | pnpm cli:agent -- prompt.get --stdin
```

PowerShell:

```powershell
Get-Content .\payload.json -Raw | pnpm cli:agent -- prompt.get --stdin
```

## 5. Recommended production rules

- Use one token per agent or integration.
- Rotate tokens by creating a new token and revoking the old row in `cli_tokens`.
- Keep `PROMPTMINDER_TOKEN` only in your secret store or process environment.

## 6. Supported agent actions

- `team.list`
- `prompt.list`
- `prompt.get`
- `prompt.create`
- `prompt.update`
- `prompt.delete`
- `tag.list`
- `tag.create`
- `tag.update`
- `tag.delete`

### Workspace Skill actions (0.2.0, unreleased)

Repository 0.2.0 adds `skill.list`, `skill.get`, `skill.import`, `skill.update`, and `skill.install`. These are not available in npm 0.1.3. Singular `promptminder skill` manages workspace packages; plural `promptminder skills` manages bundled CLI instructions.

See the [workspace Skill guide](../packages/promptminder-cli/README.md#workspace-skill-packages-020-unreleased) for command examples, version selection, approval behavior and package limits. Publish the CLI package before documenting these commands as available in the public npm install.

## 7. Admin bootstrap only

Ordinary users can ignore this section.

If you are bootstrapping production before the web UI is available:

1. Run the migration against the production `DATABASE_URL`.

```bash
pnpm db:migrate
```

2. Mint a token manually:

```bash
pnpm cli:token --user <clerkUserId> --name agent-prod
```

The token is only shown once. Store it in your secret manager.

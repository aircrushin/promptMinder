---
name: promptminder-cli
description: Use when running promptminder or promptminder-agent commands, setting PROMPTMINDER_TOKEN, passing --team for workspace scoping, handling JSON stderr errors like "Missing token" or HTTP 401, or using the agent wrapper with dot-notation actions and --input JSON.
---

# PromptMinder CLI

## Overview

`promptminder` is a JSON-in / JSON-out CLI for managing prompts, tags, and teams via the PromptMinder API. Every success response goes to **stdout**; every error goes to **stderr** as `{"error":{"message":"...","status":null}}`.

Requires Node.js ≥ 20. Install the CLI first:

```bash
npm i -g @aircrushin/promptminder-cli
```

To update, run `npm i -g @aircrushin/promptminder-cli@latest`; check the installed version with `npm list -g @aircrushin/promptminder-cli --depth=0`.

## Auth and Token

Choose environment auth or local login; either is sufficient. An old `PROMPTMINDER_TOKEN` overrides a newly saved login.

Token resolution order: `--token` flag -> `PROMPTMINDER_TOKEN` env var -> saved config.

```bash
# One-time interactive login (saves token to ~/.promptminder/config.json)
promptminder auth login --token pm_xxx

# CI / scripts: prefer env var, no saved state needed
export PROMPTMINDER_TOKEN=pm_xxx
promptminder prompt list
```

`promptminder auth logout` removes only the saved token, not `PROMPTMINDER_TOKEN`.

## Quick Reference

```text
promptminder auth login --token <token>
promptminder team list
promptminder prompt list   [--team <id>] [--tag <tag>] [--search <text>] [--page <n>] [--limit <n>]
promptminder prompt get    <id> [--team <id>]
promptminder prompt create --title <text> --content <text> [--description <text>] [--tags <csv>] [--version <text>] [--team <id>]
promptminder prompt update <id> [--title <text>] [--content <text>] [--team <id>]
promptminder prompt delete <id> --yes [--team <id>]
promptminder tag list      [--team <id>] [--include-public <true|false>]
promptminder tag create    --name <text> [--team <id>]
promptminder tag update    <id> --name <text> [--team <id>]
promptminder tag delete    <id> --yes [--team <id>]
```

Run `promptminder help` for up-to-date full usage.

## Team Scoping

Pass `--team <uuid>` to target a non-personal workspace. Omitting `--team` targets the personal workspace. The flag is always `--team`, never `--team-id`.

```bash
promptminder prompt list --team team-uuid-xyz
```

## Content Input Sources

`prompt create` and `prompt update` accept content three ways - use exactly one:

| Flag | When to use |
|------|-------------|
| `--content "..."` | Inline short text |
| `--content-file path/to/file.txt` | Content from a local file |
| `--stdin` | Pipe content from another command |

## Agent Wrapper (`promptminder-agent`)

Use `promptminder-agent` in scripts and AI agent pipelines. Actions use **dot notation**, not space-separated subcommands. Input is a single `--input` JSON object, not individual flags.

```bash
# List prompts
promptminder-agent prompt.list

# Get a specific prompt
promptminder-agent prompt.get --input '{"id":"prompt-id"}'

# Create a prompt in a team
promptminder-agent prompt.create --input '{"title":"SQL helper","content":"Write clean SQL","team":"team-uuid"}'

# Pipe JSON from a file
cat payload.json | promptminder-agent prompt.create --stdin
```

Available actions: `team.list`, `prompt.list`, `prompt.get`, `prompt.create`, `prompt.update`, `prompt.delete`, `tag.list`, `tag.create`, `tag.update`, `tag.delete`.

Run `promptminder-agent help` for the full list with input field requirements.

## Workspace Skill packages (0.2.0, unreleased)

As of 2026-09-10, npm latest is 0.1.3. Check `promptminder help` before using the following repository-only 0.2.0 commands; do not assume a public npm installation supports them.

Singular `skill` manages workspace packages; plural `skills` manages the bundled CLI instruction skill.

```text
promptminder skill list [--team <id>] [--search <text>]
promptminder skill get <id> [--team <id>] [--version <label>]
promptminder skill import <directory> [--team <id>] [--version <label>]
promptminder skill update <id> <directory> [--team <id>] [--version <new-label>]
promptminder skill install <id> [--team <id>] [--version <label>] [--target codex] [--out-dir <directory>]
```

Agent actions: `skill.list`, `skill.get`, `skill.import`, `skill.update`, `skill.install`. Use `id` for get/update/install and `directory` for import/update in the JSON input; scope with `team`.

```bash
promptminder-agent skill.install --input '{"id":"<prompt-id>","team":"<team-id>","out-dir":"./reviewed-skills"}'
```

Omit `--team` for personal scope. IDs identify saved snapshots; `--version` selects a label in the same lineage. Team proposals must be approved before installation. Packages require `SKILL.md` with `name` and `description`, at most 200 files and 2 MB total. Installation defaults to project `.cursor/skills`, never runs package scripts, and refuses overwrites even with `--force`; choose a new `--out-dir` instead.

## Error Triage

| Stderr message | Cause | Fix |
|---|---|---|
| `Missing token. Pass --token or run promptminder auth login.` | No token found | Set `PROMPTMINDER_TOKEN` or run `auth login` |
| HTTP 401 | Token invalid or expired | Update the active token source; check for an old `PROMPTMINDER_TOKEN` overriding saved login |
| `Destructive commands require --yes` | Delete without confirmation flag | Add `--yes` |
| `Use only one of --content, --content-file, or --stdin` | Multiple content sources | Keep only one |

## Common Mistakes

- **Wrong agent wrapper syntax**: `promptminder-agent prompt list` fails - use `promptminder-agent prompt.list` (dot notation).
- **Wrong team flag**: `--team-id` does not exist - use `--team <uuid>`.
- **Piping with jq**: pipe `promptminder prompt list | jq .` - stdout is always JSON.
- **Token in CI**: prefer `PROMPTMINDER_TOKEN` env var; avoid checking in the token or running interactive `auth login` in pipelines.

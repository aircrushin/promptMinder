# @aircrushin/promptminder-cli

PromptMinder command line client for managing prompts, tags, and teams over the PromptMinder HTTP API.

## Install

Requires Node.js ≥ 20.

```bash
npm i -g @aircrushin/promptminder-cli
```

Update to the latest published version and check your installation:

```bash
npm i -g @aircrushin/promptminder-cli@latest
npm list -g @aircrushin/promptminder-cli --depth=0
```

## Get a token

Create your token in the web app:

```text
https://www.prompt-minder.com/settings/cli-tokens
```

Copy it once and keep it in your shell or secret manager.

## Environment

Choose either an environment variable (recommended for scripts and agents) or local login. Setting the environment variable is sufficient; you do not need both.

Set the token in the shell where the CLI runs:

```bash
export PROMPTMINDER_TOKEN=pm_xxx
```

PowerShell:

```powershell
$env:PROMPTMINDER_TOKEN = "pm_xxx"
```

Alternatively, run `promptminder auth login --token pm_xxx` to save the token in `~/.promptminder/config.json`. Token precedence is `--token` → `PROMPTMINDER_TOKEN` → saved config. An old environment variable overrides a new saved login; `auth logout` only removes the saved token.

The CLI is hard-wired to `https://www.prompt-minder.com`.

## Usage

```bash
promptminder help
promptminder team list
promptminder prompt list
promptminder prompt get <promptId>
promptminder prompt create --title "My Prompt" --content "Hello"
promptminder tag list
```

## Agent wrapper

The package also ships a whitelist wrapper intended for AI agents:

```bash
promptminder-agent prompt.list
promptminder-agent prompt.get --input '{"id":"prompt-id"}'
promptminder-agent prompt.create --input '{"title":"My Prompt","content":"Hello"}'
```

## Agent Skills

The official PromptMinder Agent Skill now lives in the standalone repository `aircrushin/promptminder-cli-skill`. That repository is the canonical public source and the recommended installation path for tools that support the Agent Skills open format.

Install the skill directly from GitHub:

```bash
npx skills add aircrushin/promptminder-cli-skill
```

List installed skills to verify installation (`skills find` only searches discoverable skills):

```bash
npx skills list
```

The CLI still ships bundled skills and `promptminder skills install`, but that path is now a deprecated compatibility option for existing users.

Install the bundled copy into your Cursor user directory (`~/.cursor/skills/`):

```bash
promptminder skills install
```

Other bundled install targets:

```bash
promptminder skills install --target cursor-project   # .cursor/skills/ in cwd (team/repo scope)
promptminder skills install --target claude           # ~/.claude/skills/
promptminder skills install --target codex            # ~/.agents/skills/
```

Use `--force` to overwrite an existing installation, `--skill <name>` to install a single bundled skill.

List bundled skills:

```bash
promptminder skills list
```

Print the bundled skills directory path:

```bash
promptminder skills path
```

Skills follow the [agentskills.io specification](https://agentskills.io/specification).

## Publish

Before publishing:

1. Login with `npm login`.
2. Publish from this package directory:

```bash
cd packages/promptminder-cli
npm publish --access public
```

## Workspace Skill packages (0.2.0, unreleased)

As of 2026-09-10, npm latest is 0.1.3. The following commands are implemented in this repository but are not available through the public npm install yet.

Use the singular `skill` command for your workspace's saved packages. The plural
`skills` command above still manages the bundled CLI instruction skill.

```bash
promptminder skill list --team <team-id> --search review
promptminder skill import ./review-skill --team <team-id> --license MIT --source-url https://example.com/repo --source-version <commit>
promptminder skill get <prompt-id> --team <team-id>
promptminder skill install <prompt-id> --team <team-id> --target codex
promptminder skill install <prompt-id> --team <team-id> --version 1.0.1 --out-dir ./reviewed-skills
promptminder skill update <prompt-id> ./review-skill --team <team-id> --version 1.0.2
promptminder-agent skill.install --input '{"id":"<prompt-id>","team":"<team-id>","out-dir":"./reviewed-skills"}'
```

Omit `--team` for your personal workspace. The ID pins an immutable saved snapshot.
Optional `--version` resolves a label in that ID's lineage; duplicate labels are
rejected, so use the exact ID in that case. Search returns up to 200 saved versions.

Imports and updates follow the team's approval setting. With approval enabled,
the response contains a change request; the proposal becomes installable only
after approval. Without approval, saving publishes directly. Members can propose
improvements to a team Skill when approval is enabled. Otherwise, edits require
the creator or a team manager.

Packages require a UTF-8 `SKILL.md` with `name` and `description` frontmatter.
Up to 200 files and 2 MB total are supported, including binary assets and executable
permissions. The CLI rejects symlinks and unsafe paths. It installs files without
running their scripts and refuses to overwrite an existing package, even with
`--force`. The default target is `.cursor/skills` in the current project.
`.promptminder-install.json` records the source, exact ID, version and file hashes;
it never contains the access token. Re-importing an installed folder preserves
its source record. Browser folder imports infer executable permission from a
shebang; the editor offers an explicit permission checkbox for each file.

Catalog imports preserve the stored text-file snapshot and its source/license/hash.
That snapshot may omit upstream binary assets; use a complete local folder when
those are needed. Web comparisons use the most recently synced catalog snapshot,
not a live Git fetch, and merge only explicitly selected whole files.

The server must apply `0005_workspace_skills` before deploying this feature.
This package version is prepared locally; publishing it is a separate release step.

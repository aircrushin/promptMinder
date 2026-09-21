# PromptMinder agent instructions

## Scope and working style

- Follow system instructions, then the user's request, then this file. Keep changes within the requested scope and preserve unrelated work.
- Read only the files and references needed for the task. Use `PRODUCT.md` and `DESIGN.md` for UI work, schema/migration files for database work, and the relevant route or package tests for behavior changes.
- Trace the shared path and its callers before fixing a bug. Prefer an existing helper, native platform feature, or installed dependency before adding code or a package.
- Continue through implementation, focused verification, and fixing failures caused by the change. Treat the task as complete only when the requested behavior is working and evidence is available.
- Do not ask for approval for local, disposable tests or lint runs. Ask only before an external or irreversible action when the user has not already authorized it.

## Project facts

- Next.js 16 App Router, React 19, JavaScript only, pnpm, Clerk, Neon PostgreSQL with Drizzle, Radix UI, Tailwind, Lucide, and Framer Motion.
- `packages/promptminder-cli` is a workspace package. The web app and CLI share skill/package behavior, so changes to one should be checked against the other when relevant.
- Use `@/` imports, two-space indentation, semicolons, single quotes in JavaScript, and double quotes in JSX attributes. Components are functional and client components declare `'use client';`.
- Reuse `cn()` for class merging, `apiClient` for client requests, `ApiError` for API failures, and `useToast()` for user feedback.

## Authorization and data boundaries

- API routes require `requireUserId()`, resolve the team context, enforce membership where needed, and use `handleApiError()` for failures.
- Team-scoped queries must filter by `team_id`. Personal workspace data uses the existing null-team convention. Do not bypass the team service or trust a client-provided team without server-side authorization.
- Keep secrets in environment variables. Never commit `.env*`, tokens, credentials, generated build output, or database dumps.
- For prompt/skill installation or deletion, preserve the existing validation, size limits, overwrite protection, and explicit destructive flags.

## Verification

- Run the narrowest relevant test first, then `pnpm lint` for code changes. Expand to `pnpm test`, `pnpm build`, or database checks when the change crosses those boundaries.
- Run a focused Jest file with `pnpm test -- <path>`; do not require the full suite for an isolated documentation or UI copy change.
- At minimum run `git diff --check` and report any pre-existing failure separately from a regression.
- For skill edits, validate frontmatter, keep automatic discovery enabled unless explicitly requested otherwise, and check that references are linked and loaded progressively.
- Do not claim deployment, migration, external API, or browser behavior without directly verifying it.

## Git and completion

- Review the diff before staging. Commit only when requested; never push without an explicit request.
- Keep the diff minimal and explain material limitations or unverified boundaries in the final report.

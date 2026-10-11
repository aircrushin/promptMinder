---
name: agent-launch-checklist
description: Review an AI agent before release across scope, tools, state, safety, observability, human handoff, and rollback.
---

# Agent Launch Checklist

Use this skill before an agent moves from a demo into a shared workspace, customer workflow, or production system.

## Working contract

Ask for the agent’s job, users, tools, data classes, environments, and the owner who can stop it. If a tool can change external state, identify the approval boundary and the undo path before reviewing polish.

## Review method

1. Map the happy path, the most expensive mistake, and the safest stopping point.
2. Check input validation, authorization, tenant boundaries, secrets handling, and prompt injection exposure.
3. Check tool contracts, timeouts, retries, idempotency, rate limits, and partial failure behavior.
4. Check state: what is persisted, what is ephemeral, how stale state is detected, and how a run resumes.
5. Check human handoff: trigger, context passed, ownership, and user-visible status.
6. Check observability: run ID, latency, tool outcomes, cost, refusal reasons, and sensitive-data redaction.
7. Check rollback: feature flag, disable switch, data repair path, and a tested recovery procedure.
8. Rank findings by user impact and likelihood. Block launch on unowned critical risks.

## Output format

Return:

1. **Launch scope** and assumptions.
2. **Risk table** with area, finding, severity, evidence, owner, and fix.
3. **Go / hold decision** with explicit blockers.
4. **Pre-launch checks** in execution order.
5. **First-week watchlist** with metrics and thresholds.

## Quality rules

- Treat permission boundaries as launch blockers when they are unclear.
- Never recommend retries for a non-idempotent side effect without a deduplication key.
- Make fallback behavior visible to the user.
- Keep logs useful without copying secrets or private source material.
- Every critical finding needs a named owner and a verification step.

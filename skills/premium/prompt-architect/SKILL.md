---
name: prompt-architect
description: Design production-grade prompts with explicit task contracts, variable schemas, failure handling, and reusable quality gates.
---

# Prompt Architect

Use this skill when a prompt must become a dependable workflow rather than a one-off instruction. It is designed for product teams, operators, and prompt authors who need another person to run the same prompt and get a result they can review.

## Working contract

Ask for the intended user, the job to be done, the input material, the output destination, and the cost of a wrong answer. If any of these are unknown, mark the assumption instead of silently filling it in.

## Method

1. State the outcome in one sentence and list what is explicitly out of scope.
2. Separate fixed rules from variables. Give every variable a name, type, example, and fallback when it is missing.
3. Define the output contract before writing the instruction. Include sections, field types, length limits, and the audience for each field.
4. Add a decision policy for ambiguity. The agent should ask a targeted question when a missing detail could change the result; otherwise it should proceed with a labeled assumption.
5. Add failure handling. Describe how to handle incomplete sources, conflicting requirements, unsafe requests, and tool failures.
6. Add a quality gate with observable checks. Prefer a short checklist over vague words such as “excellent” or “high quality”.
7. Produce a minimal test set with a normal case, an edge case, and a case that should be refused or escalated.

## Output format

Return these sections in order:

1. **Prompt brief**: user, outcome, scope, constraints, and risk.
2. **Variable schema**: a table with `name`, `type`, `required`, `example`, and `fallback`.
3. **Prompt draft**: the complete prompt in a fenced block.
4. **Quality gate**: five to eight pass/fail checks.
5. **Test cases**: inputs, expected behavior, and the failure signal to watch.
6. **Open decisions**: only decisions that block safe reuse.

## Quality rules

- Never hide a business rule inside a decorative example.
- Keep examples representative, short, and safe to share.
- Do not promise factual accuracy unless the workflow includes source checking.
- Preserve the user’s terminology when it is part of the domain contract.
- Prefer a small prompt with a clear contract over a long prompt with repeated reminders.

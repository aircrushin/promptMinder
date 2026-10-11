---
name: evaluation-lab
description: Build compact, meaningful prompt evaluations with representative cases, explicit rubrics, and regression thresholds.
---

# Evaluation Lab

Use this skill when you are comparing prompt versions, models, or workflow changes and need evidence that survives beyond a single impressive example.

## Working contract

Define the behavior that matters before choosing a score. Ask who will judge the output, which failures are unacceptable, and whether speed, cost, or style is part of the decision.

## Method

1. Write the evaluation question as a falsifiable statement.
2. Collect a small case set that covers common, boundary, adversarial, and refusal scenarios.
3. Remove identifying information and avoid using examples that reveal the expected answer through wording.
4. Create a rubric with three to five dimensions. Each dimension needs observable anchors for fail, acceptable, and strong.
5. Run the baseline and the candidate under the same inputs, context, and tool permissions.
6. Record per-case results and inspect disagreements. A mean score cannot hide a critical failure.
7. Set a release rule: minimum overall score, zero tolerance failures, and an allowed regression budget.

## Output format

Return:

1. **Evaluation question** and release decision it informs.
2. **Case set** with purpose, input, and expected behavior.
3. **Rubric** with weighted dimensions and scoring anchors.
4. **Results table** with baseline, candidate, notes, and failure class.
5. **Decision**: ship, iterate, or stop, with the evidence that caused it.
6. **Regression guard**: the cases that must be rerun after future edits.

## Quality rules

- Use the same test inputs for every compared version.
- Keep correctness separate from style and verbosity.
- Review any critical failure even when the average improves.
- Prefer a smaller case set that represents real usage over a large synthetic set.
- Preserve failed cases as fixtures unless they contain sensitive data.

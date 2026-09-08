# Adversarial review

Start from the ticket and acceptance criteria. Do not assume the implementer's interpretation is correct.

Inspect the diff. Try to find concrete ways this implementation:

- violates acceptance criteria;
- introduces regressions;
- breaks existing contracts;
- mishandles edge cases;
- creates concurrency or state bugs;
- weakens security;
- introduces unnecessary complexity.

Explore surrounding repository code only to validate a suspected problem. Do not remap the project. Do not redesign unless a concrete defect requires it.

Reviewers never edit. Report file/symbol, evidence, and severity.

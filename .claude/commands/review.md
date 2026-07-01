---
description: Review the current diff before committing
---

Review the pending changes (`git diff`) as a senior engineer on a financial platform.

Check for:

- **Correctness** — logic bugs, off-by-one, unhandled cases.
- **Money & precision** — no floats for currency/quantity; correct rounding; ledger balances.
- **Security** — authz on every mutation, input validation, no secrets or PII in logs.
- **Consistency** — matches conventions in `CLAUDE.md` and existing patterns.
- **Tests** — new logic is covered; edge cases included.
- **Docs** — `docs/` and `docs/diagrams/` updated if architecture/data/API changed.

Report findings grouped by severity (blocker / should-fix / nit). Do not fix silently — list
issues first, then offer to apply fixes.

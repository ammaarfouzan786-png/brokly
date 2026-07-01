---
description: Run the test suite and triage failures
---

Run the project's checks and report results:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`

If anything fails, triage each failure: root cause, the minimal fix, and whether it's a product
bug or a test that needs updating. Fix straightforward failures and re-run. For anything
ambiguous or risky (especially around money, orders, or auth), stop and explain before changing.

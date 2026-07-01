---
description: Plan a new feature before writing code
---

Plan the implementation of the feature described below. Do not write code yet.

Feature: $ARGUMENTS

Produce:

1. **Scope** — what's in, what's explicitly out.
2. **Affected domains** — which of Brokly's domains (accounts, KYC, funding, market data,
   orders, portfolio, notifications) this touches. See `CLAUDE.md`.
3. **Data model changes** — new/changed tables or fields; reference `docs/DATA_MODEL.md`.
4. **API surface** — endpoints or events added/changed; reference `docs/API.md`.
5. **Risks & compliance** — money/precision, auth, PII, or regulatory concerns.
6. **Task breakdown** — an ordered checklist of small, verifiable steps.
7. **Test plan** — what proves this works (unit, integration, edge cases).

Flag any assumptions instead of guessing. When done, wait for approval before implementing.

# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository. Read this first.

> **Assumption to verify:** This scaffold treats **Brokly** as an online brokerage / trading
> platform built as a full-stack TypeScript application. The empty repo had no product spec, so
> this was inferred from the name. If Brokly is something else, update this file and
> `docs/ARCHITECTURE.md` — everything else keys off them.

## What Brokly is

Brokly is a web-based brokerage platform. Users open and verify an account (KYC), fund it,
browse tradable assets with live market data, place and manage orders, and track a portfolio and
statements. A server-side execution layer talks to external market-data and liquidity providers,
a payment processor, and a KYC/compliance provider.

Core domains:

- **Accounts & Auth** — sign-up, login, sessions, account lifecycle.
- **KYC / Compliance** — identity verification, sanctions/PEP screening, audit trail.
- **Funding & Payments** — deposits, withdrawals, ledger, reconciliation.
- **Market Data** — quotes, order books, historical bars (streamed to clients).
- **Orders & Execution** — order capture, validation, routing, fills, lifecycle.
- **Portfolio & Reporting** — positions, P&L, balances, statements.
- **Notifications** — email/push/in-app for fills, funding, and account events.

## Tech stack (default)

- **Frontend:** Next.js (React, TypeScript), Tailwind CSS.
- **Backend:** Node.js + TypeScript, modular services behind an API/BFF layer.
- **Data:** PostgreSQL (via Prisma), Redis for cache + queues, a message bus for events.
- **Realtime:** WebSockets for live quotes and order updates.
- **Infra:** Docker for local dev; CI runs lint + typecheck + tests.

See `docs/ARCHITECTURE.md` for the component map and `docs/DATA_MODEL.md` for the schema.

## Repository layout

```
Brokly/
├── CLAUDE.md            # You are here
├── README.md           # Human onboarding
├── .env.example        # Required environment variables (copy to .env.local)
├── .claude/            # Claude Code config + custom slash commands
│   ├── settings.json
│   └── commands/
├── docs/               # Architecture, data model, API, setup, handoff
│   └── diagrams/       # Mermaid source (.mermaid) for all diagrams
└── src/ (to be added)  # Application code once the stack is initialized
```

Application source does not exist yet — this is a documentation-and-config scaffold. When you
initialize the app, follow the structure described in `docs/ARCHITECTURE.md`.

## Conventions

- **Language:** TypeScript everywhere. `strict` mode on. No `any` without a `// why:` comment.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for types/React components,
  `SCREAMING_SNAKE_CASE` for env vars and constants.
- **Money:** never use floats for currency or quantities. Use integer minor units (cents) or a
  decimal library. This is a financial system — precision bugs are real bugs.
- **Time:** store and compute in UTC; format to local only at the presentation edge.
- **Errors:** fail loud in services, degrade gracefully in the UI. No silent catches.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **Branches:** `feature/<slug>`, `fix/<slug>`. Open PRs against `main`.

## Common commands

These are placeholders until the app is scaffolded — update the scripts as you add them.

```bash
# install deps
npm install

# run the dev server
npm run dev

# typecheck + lint
npm run typecheck
npm run lint

# tests
npm test

# database (Prisma)
npm run db:migrate
npm run db:seed
```

## Working agreements for agents

1. **Read before writing.** Check `docs/` and existing code before adding anything.
2. **Small, verifiable changes.** Prefer focused diffs; run typecheck + tests before declaring done.
3. **Never fake financial logic.** Order matching, ledger, and P&L must be correct and tested, not
   stubbed with hand-wavy math. If unsure, leave a `TODO(compliance):` and flag it.
4. **Secrets stay out of git.** Use `.env.local`; never commit real keys. `.env.example` documents
   the shape only.
5. **Update the docs you invalidate.** If you change the architecture, data model, or API, update
   the matching file in `docs/` and its diagram in `docs/diagrams/` in the same change.
6. **Ask when the domain is ambiguous.** Brokerage rules (settlement, margin, regulatory) vary by
   jurisdiction — surface assumptions rather than guessing silently.

## Security & compliance notes

This is regulated-adjacent software. Treat PII, funding data, and order flow as sensitive.
Log for audit, not for leakage (no full PANs, no raw KYC documents in logs). All external
provider calls go through the service layer, never directly from the client.

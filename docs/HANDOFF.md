# Engineering handoff

Detailed handoff for whoever (human or agent) builds Brokly from this scaffold. Read
[`CLAUDE.md`](../CLAUDE.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) first.

## 1. Status: what exists today

This repository is a **documentation-and-config scaffold**. There is no application code yet.
What's here:

- `CLAUDE.md` — agent guidance and conventions.
- `.claude/` — Claude Code settings and slash commands (`/plan-feature`, `/review`, `/test`).
- `README.md`, `.gitignore`, `.editorconfig`, `.nvmrc`, `.env.example`, `LICENSE`.
- `docs/` — architecture, data model, API, setup, this handoff.
- `docs/diagrams/` — mermaid sources for every diagram.
- `src/` — empty placeholder for application code.

## 2. Important caveat

The product definition (an online brokerage), the tech stack, the data model, and the API are all
**inferred from the project name** — the repo arrived empty with no spec. Before building, confirm:

- Is Brokly actually a brokerage/trading platform? If not, what is it?
- Is the assumed stack (Next.js + Node + Postgres + Redis) correct?
- Which asset classes and jurisdictions? These drive settlement, margin, and regulatory rules.

If any answer differs, update `CLAUDE.md`, `ARCHITECTURE.md`, and `DATA_MODEL.md` before writing
code — the rest of the docs derive from them.

## 3. Recommended build order

1. **Scaffold the app** — Next.js + TypeScript, strict mode, ESLint/Prettier, Vitest/Jest,
   Prisma. Add `dev`, `build`, `typecheck`, `lint`, `test`, `db:*` scripts and wire them into
   `.claude/commands`.
2. **Infra** — `docker-compose.yml` for Postgres + Redis; a `schema.prisma` from `DATA_MODEL.md`.
3. **Auth & accounts** — registration, login, sessions, account creation.
4. **KYC gate** — provider integration (mock first), status gating.
5. **Funding & ledger** — double-entry ledger, deposit/withdrawal against a mock processor.
6. **Market data** — provider ingest → Redis → WebSocket gateway; quotes in the UI.
7. **Orders & execution** — capture, risk/balance check, routing (mock LP), fills, lifecycle.
8. **Portfolio & reporting** — positions, average cost, P&L, statements from events.
9. **Notifications** — fills, funding, account events.
10. **Harden** — observability, idempotency, reconciliation jobs, rate limits, audit logging.

Build each vertical slice end-to-end (API + persistence + tests) before moving on.

## 4. Non-negotiables

- **Money is integer minor units.** No floats for currency or quantity, anywhere.
- **Ledger is the source of truth for cash.** Balances are projections; reconcile them.
- **Every mutation is authorized and idempotent.** Re-check account ownership in each service.
- **External calls are wrapped.** Timeouts, retries with backoff, circuit breakers; mock in tests.
- **No secrets or PII in logs.** Audit logs are separate from operational logs.

## 5. Testing strategy

- **Unit** — pure logic: order validation, average-cost math, ledger posting, P&L.
- **Integration** — service + DB against a disposable Postgres; provider calls mocked.
- **Contract** — lock the shapes in `API.md` so the client and BFF don't drift.
- **End-to-end (later)** — register → verify → fund → place order → see position.
- Treat money/order/ledger paths as high-risk: exhaustive edge cases, property tests where useful.

## 6. Diagrams

All diagrams live as mermaid source in [`docs/diagrams/`](./diagrams/) and are embedded in the
docs. Keep source and docs in sync; when you change the architecture, data model, or a flow, update
the `.mermaid` file in the same change.

| Diagram | File | Shown in |
| --- | --- | --- |
| System architecture | `diagrams/system-architecture.mermaid` | ARCHITECTURE.md |
| Order lifecycle | `diagrams/order-lifecycle.mermaid` | ARCHITECTURE.md |
| Order sequence | `diagrams/order-sequence.mermaid` | ARCHITECTURE.md |
| Data model (ER) | `diagrams/data-model.mermaid` | DATA_MODEL.md |

Render with the Mermaid CLI, at <https://mermaid.live>, or any Mermaid-aware Markdown viewer.

## 7. Open questions

- Monolith-first or services-from-day-one? (Diagram shows logical boundaries either way.)
- Event bus choice (Kafka vs. lighter queue).
- Regulatory scope — which regimes, and who owns compliance sign-off?
- Self-hosted market data ingest vs. fully delegated provider stream.

Capture answers as ADRs (see the `engineering:architecture` skill) so decisions are traceable.

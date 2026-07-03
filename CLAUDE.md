# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository. Read this first.

> **Product (confirmed):** **Brokly** is a **real-estate brokerage CRM for Indian property
> brokers**, with WhatsApp at its core. It was built from the HTML prototypes in the repo root
> (`Brokly_*.html`) and `Brokly_flow.mermaid`. The earlier "stock brokerage / trading platform"
> guess (still reflected in `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md`) was **wrong** — treat
> this file, `README.md`, and the code under `src/` as current.

## What Brokly is

Brokly runs a property broker's whole day from one app (web + installable PWA). Core domains
(each is a screen under `src/components/screens/`):

- **Inbox** — unified WhatsApp inbox with context-aware AI-suggested replies (official Cloud API).
- **Stock** — the broker's property inventory.
- **Clients & matching** — capture a buyer brief, rank stock with a scored match (`src/lib/matching.ts`).
- **Links** — single + auto-updating "smart collection" share links; public buyer view at `/l/...`.
- **Leads** — enquiries returned AI-scored (HOT/WARM/COLD), tied to the property.
- **Co-broke** — other brokers' inventory, owner kept out-of-band (OOB), commission protected.
- **Money** — commission (co-broke split + 18% GST) → GST invoice + payment link (`src/lib/commission.ts`).
- **Lawyer** — Karnataka stamp-duty/registration calc + rental/sale deed drafts (`src/lib/stampduty.ts`).
- **Brand** — logo generator with SVG export. Plus a floating **AI assistant** over live data.

Region assumptions: India / Bengaluru / ₹ INR / Karnataka. All money is integer **paise**.

## Tech stack (as built)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict).
- **Styling:** hand-built CSS design system in `src/app/globals.css` (ported from the prototypes).
  Tailwind is **not** used despite the original guess.
- **State:** Zustand (`src/lib/store.ts`), persisted to `localStorage`.
- **WhatsApp:** official Meta **Cloud API** — `src/lib/whatsapp.ts` + `src/app/api/whatsapp/*`
  (webhook verify/receive, send, poll, status). Simulates when unconfigured; see `WHATSAPP_SETUP.md`.
- **Share links + enquiries:** `/l/[...slug]` + `/api/links` + `/api/enquiry`, backed by
  process-local in-memory stores (`src/lib/link-store.ts`, `src/lib/server-store.ts`).
- **Mobile:** installable PWA (`public/manifest.webmanifest`, `public/sw.js`).

> The Postgres/Prisma/Redis/WebSocket stack from the old guess is **not** used — state is
> client-side + in-memory so the app runs with zero external services. Adding a real DB for
> persistence + a real auth provider are the natural next steps.

## Repository layout

```
Brokly/
├── CLAUDE.md            # You are here
├── README.md           # Human onboarding
├── .env.example        # Required environment variables (copy to .env.local)
├── .claude/            # Claude Code config + custom slash commands
│   ├── settings.json
│   └── commands/
├── docs/               # ⚠ old stock-brokerage guess — superseded by code + README
│   └── diagrams/       # Mermaid source (.mermaid)
├── public/             # PWA manifest, service worker, icons
├── Brokly_*.html       # Product prototypes the app was built from
└── src/
    ├── app/            # App Router: page, layout, /l/[...slug], /api/* (whatsapp, links, enquiry)
    ├── components/     # UI: screens/, Shell, Modal, BuyerOverlay, Assistant, Auth…
    └── lib/            # Domain: store, money, matching, stampduty, commission, whatsapp, seed
```

The app is implemented under `src/` (Next.js App Router). The money/matching/commission/stamp-duty
logic in `src/lib/` are pure functions — easy to unit-test.

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

```bash
npm install          # install deps
npm run dev          # dev server → http://localhost:3000
npm run build        # production build (forces NODE_ENV=production — see note below)
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
```

> **Build gotcha:** `next build` must run with `NODE_ENV=production`. The `build` script sets it.
> If `NODE_ENV=development` leaks into the build env, the internal `/404` `/500` error pages fail
> to prerender with a misleading "Html should not be imported outside of pages/_document" error.

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

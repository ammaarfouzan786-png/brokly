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
- **Brand** — logo/business-card/avatar generator with SVG export.
- **Marketing** — template studio (listing copy, ads, reels, analysis) with Gemini or fallback copy.
- **Pulse** — market-intelligence feed (seeded; refreshes via Gemini when configured).

Plus a floating **AI assistant** over live data, and a standalone **listing engine** outside the
tab shell: `/new` (paste a messy WhatsApp property message → AI-parsed listing), `/listing/[slug]`
(public listing page), `/dashboard` (live leads + listings). These three need Supabase.

The logged-in broker identity comes from `src/lib/broker.ts` (`activeBroker()` — onboarded profile
with the seed `BROKER` as fallback). Never render the seed broker's name directly.

Region assumptions: India / Bengaluru / ₹ INR / Karnataka. All money is integer **paise**
(exception: the Supabase listing engine stores whole rupees — see `src/lib/listing-format.ts`).

## Tech stack (as built)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict).
- **Styling:** hand-built CSS design system in `src/app/globals.css` (ported from the prototypes).
  Tailwind is **not** used despite the original guess.
- **State:** Zustand (`src/lib/store.ts`), persisted to `localStorage`.
- **WhatsApp — three distinct paths** (don't confuse them):
  1. **CRM inbox (Cloud API):** `src/lib/whatsapp.ts` + `/api/whatsapp/*` (webhook at
     `/api/whatsapp/webhook`, send, poll, status). Simulates when unconfigured; `WHATSAPP_SETUP.md`.
  2. **Listing bot (Cloud API, prod):** `src/lib/whatsapp-cloud.ts` + `/api/webhook/whatsapp`
     → `src/lib/bot.ts` → Supabase listings.
  3. **Listing bot (OpenWA, QR demo):** `src/lib/openwa.ts` + `/api/webhook/openwa` → same bot;
     `OPENWA_SETUP.md`. Choose Cloud API *or* OpenWA, not both.
- **Persistence layers:** client Zustand→localStorage (CRM); durable KV (`src/lib/kv.ts` —
  Upstash Redis when configured, else in-memory) for share links/enquiries/inbound messages;
  **Supabase** (optional — `src/lib/supabase.ts`, `db.ts`, `supabase/schema.sql`) for the listing
  engine, leads and Realtime broadcast. Everything degrades gracefully when unconfigured.
- **AI:** Gemini (`src/lib/gemini.ts`, `src/lib/parser.mjs` heuristic fallback) for listing
  parsing, marketing copy, pulse. Inbox suggestions are rule-based (`src/lib/messages.ts`).
- **Share links + enquiries:** `/l/[...slug]` + `/api/links` + `/api/enquiry`, on the KV layer
  (`src/lib/link-store.ts`, `src/lib/server-store.ts`).
- **Mobile:** installable PWA (`public/manifest.webmanifest`, `public/sw.js`).

> The app runs with **zero external services** (demo mode). Supabase, Upstash, Gemini and
> WhatsApp creds each independently flip their slice to live. Real auth is still the missing piece.

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
├── supabase/           # schema.sql for the optional listing engine
├── Brokly_*.html       # Product prototypes the app was built from
├── SUPABASE_SETUP.md / WHATSAPP_SETUP.md / OPENWA_SETUP.md   # integration guides
└── src/
    ├── app/            # App Router: page, /l/[...slug], /listing/[slug], /new, /dashboard,
    │                   #   /api/* (whatsapp, webhook, links, enquiry, leads, listings, marketing, pulse, parse)
    ├── components/     # UI: screens/ (12 tabs), Shell, Modal, BuyerOverlay, Assistant, Auth…
    └── lib/            # Domain: store, broker, money, matching, stampduty, commission,
                        #   whatsapp/whatsapp-cloud/openwa, bot, gemini, parser, kv, db, seed
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

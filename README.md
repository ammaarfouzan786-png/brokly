# Brokly

**Your whole brokerage. One app.** Brokly is a real-estate brokerage CRM for property brokers,
with **WhatsApp at its core** — a unified inbox, AI stock↔buyer matching, auto-updating shareable
property links, AI-scored leads, a co-broking marketplace, commission/GST invoicing, and a
built-in stamp-duty & deed generator. It runs as a **web app and an installable mobile app (PWA)**
from a single codebase.

> Built from the product prototypes in the repo root (`Brokly_*.html`, `Brokly_flow.mermaid`).
> The earlier "stock brokerage" description in the scaffold was an inference from the name and has
> been corrected.

## What's inside

| Screen | What it does |
| --- | --- |
| **Home** | AI morning brief + at-a-glance stats + the full flow |
| **Inbox** | WhatsApp chats in one place with context-aware AI-suggested replies |
| **Stock** | Property inventory; add/preview/share/list-for-co-broke |
| **Clients** | Capture a buyer brief → **AI match** ranks your stock → build a link |
| **Co-broke** | Other brokers' inventory, owner kept **out-of-band**, commission protected |
| **Links** | Single + **smart-collection** links; opens the buyer view; auto-updates |
| **Leads** | Enquiries come back **AI-scored** (HOT/WARM/COLD), tied to the property |
| **Money** | Commission calc (co-broke split + 18% GST) → GST invoice + payment link |
| **Lawyer** | Karnataka stamp-duty calculator + rental/sale **deed drafts** |
| **Brand** | Logo generator with SVG export |

Plus a floating **AI assistant** that answers over your live data, a **public buyer link** page
(`/l/...`) with an enquiry form that feeds leads back to the broker, and an **installable PWA**.

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- Hand-built CSS design system (`src/app/globals.css`) — no Tailwind
- **Zustand** store, persisted to `localStorage`
- Official **WhatsApp Cloud API** integration (`src/lib/whatsapp.ts` + `/api/whatsapp/*`)
- In-memory server stores for share links + enquiries (swap for a DB in production)
- **PWA**: `public/manifest.webmanifest` + `public/sw.js`
- Money is stored as **integer paise** everywhere (`src/lib/money.ts`) — no float currency

## Getting started

```bash
nvm use              # optional — uses .nvmrc
npm install
npm run dev          # → http://localhost:3000
```

Log in with any phone number and any 4-digit OTP (auth is mocked for now). Your data persists in
the browser; click the avatar (top-right) to log out.

### Scripts

```bash
npm run dev          # dev server
npm run build        # production build (forces NODE_ENV=production)
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
```

> **Build note:** `next build` requires `NODE_ENV=production`. The `build` script sets it for you;
> if you invoke `next build` directly in a shell where `NODE_ENV=development`, the error-page
> prerender will fail. (On Windows, use `cross-env` or set the variable manually.)

## WhatsApp — demo vs live

Out of the box the Inbox runs in **demo mode**: sends are simulated so everything works end-to-end
with no setup. Add Meta **WhatsApp Cloud API** credentials to `.env.local` and it flips to **live**
two-way messaging automatically. Full walkthrough in [`WHATSAPP_SETUP.md`](./WHATSAPP_SETUP.md).

```bash
# .env.local
WHATSAPP_TOKEN=...              # system-user / permanent access token
WHATSAPP_PHONE_NUMBER_ID=...    # Cloud API phone number id
WHATSAPP_VERIFY_TOKEN=brokly-verify
WHATSAPP_APP_SECRET=...         # optional — verifies webhook signatures
# WHATSAPP_API_VERSION=v21.0    # optional
```

Webhook URL to register in Meta: `https://<your-domain>/api/whatsapp/webhook`
(verify token must match `WHATSAPP_VERIFY_TOKEN`).

## Install as a mobile app

Open the site on a phone → browser menu → **Add to Home Screen**. It launches standalone with an
app icon and an offline shell (service worker). Same code, no separate mobile build.

## Notes & next steps

- **Buyer journey:** the customer link screen, the first-contact & AI-drafted WhatsApp messages,
  and how smart-collection links auto-update (with the "your link was updated" nudge) are
  documented in [`docs/CUSTOMER_JOURNEY.md`](./docs/CUSTOMER_JOURNEY.md). Buyer copy lives in
  `src/lib/messages.ts`.
- **Persistence:** app state is client-side (localStorage); share links + enquiries live in a
  process-local in-memory store. For multi-instance production, move these to Postgres/Redis.
- **Auth** is a mock OTP gate — wire a real provider (or WhatsApp OTP) before going live.
- `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` describe the original stock-brokerage guess and
  are superseded by the code; treat `CLAUDE.md` + this README as current.

## License

MIT — see [`LICENSE`](./LICENSE).

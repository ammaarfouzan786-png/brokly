# Brokly — Demo Build Plan

> Goal: a demo where a broker onboards, **forwards a messy property on WhatsApp → live Airbnb-style
> card**, a **MagicBricks lead email → auto lead card + draft listing + WhatsApp alert**, the **bot
> first-touches the buyer**, the buyer browses a **Brokly link and enquires**, the lead pops
> **live on the dashboard**, and the close story runs through **Money + Lawyer**. Everything below
> is ordered for execution — each milestone is independently demoable, so we're never "half broken".
>
> Status legend: ☐ todo · ◐ partial · ☑ done   |   **[A]** = needs Arnav, everything else Claude executes.

---

## Already verified working (baseline)

- ☑ CRM demo loop: onboarding → inbox → match → smart link → public buyer page → enquiry → scored lead
- ☑ Supabase live: `/new` → Gemini parse → listing page → enquiry → lead → **Realtime push to open dashboard**
- ☑ Gemini live: listing parser, marketing studio (plain-text fix), pulse (date-aware fix)
- ☑ Broker identity: Arnav Makkar / Makkar Estates / 9213125921 in app (localStorage) + `brokers` row in Supabase
- ☑ `tsc` + production `next build` green

---

## M0 — Demo hygiene (no blockers, ~half day)

*Why first: cheap, makes every later milestone look good.*

| # | Task | Detail | Done when |
|---|------|--------|-----------|
| 0.1 | Real property photos | Replace gradient placeholders: 6–10 curated interior/exterior JPGs in `public/photos/`, referenced from `seed.ts` (`imageUrl` on Property; `pcard`/buyer views render image with gradient fallback). | Stock, match results, buyer links show photos |
| 0.2 | Commit the work | Feature branch `feature/demo-prep`; conventional commits for: broker-identity fix set, marketing/pulse prompt fixes, omnichannel docs+diagrams, CLAUDE.md refresh. | Clean `git status`, PR-able branch |
| 0.3 | Clean Supabase test data **[A approve]** | Script to delete June/July test rows (`Turnkey Pub…` listings, Test/Realtime buyers) — destructive, runs only after Arnav approves. Keep schema + Arnav's broker row. | Dashboard shows only real/demo-intended data |
| 0.4 | Seed a believable demo state | 1–2 real-looking listings in Supabase under Makkar Estates (via `/new`) so the dashboard isn't empty at demo start. | Dashboard opens looking alive |

## M1 — WhatsApp live via Meta Cloud API (**blocked on [A] keys**, ~half day once unblocked)

*The "bot texts my number, I forward a listing, card appears in DB" ask.*

| # | Task | Detail | Done when |
|---|------|--------|-----------|
| 1.1 | **[A]** Meta app values | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, real `WHATSAPP_APP_SECRET`; add 9213125921 as verified test recipient. | Values in `.env.local` |
| 1.2 | Public HTTPS webhook | Quick tunnel (cloudflared/ngrok) for local demo; Vercel deploy is M4 (either satisfies Meta). | `GET /api/webhook/whatsapp` verify handshake passes |
| 1.3 | **[A]** Meta webhook config | Callback = `https://<public>/api/webhook/whatsapp`, verify token `brokly-verify`, subscribe **messages**. | Meta shows subscribed |
| 1.4 | First ping + listing round-trip | Send `hello_world` template to 9213125921 → Arnav replies (opens 24h window) → forwards property text+photos → `DONE` → card in DB → bot returns `/listing/<slug>` link. | Listing visible on dashboard with photos |
| 1.5 | Submit buyer template **early** | Create + submit `property_enquiry_details` utility template ("You enquired about {{1}} on {{2}} — details: {{3}}") — approval takes minutes-to-days, so file it in M1 even though it's used in M3. | Template approved in Meta |
| 1.6 | Bot resilience fixes | From audit backlog: don't clear session buffer on DB failure (`bot.ts`); surface media-upload failures to the sender; E.164-normalize sends (`whatsapp.ts`). | Forwarding flow survives a transient error |

## M2 — Email lead ingestion, Phase 1 (2–3 days, **can start now**, no external blockers)

*The omnichannel core: portal email → lead card + draft listing. Demoable with fixtures before any DNS/OAuth exists.*

| # | Task | Detail | Done when |
|---|------|--------|-----------|
| 2.1 | **[A]** Real fixture emails | Arnav forwards 3–5 real MagicBricks/99acres/Housing lead-notification emails (raw, with headers if possible) → `fixtures/emails/*.eml`. Parser quality depends on real samples. | Fixtures in repo (PII scrubbed) |
| 2.2 | Schema migration | Add `inbound_emails`, `portal_listings`, `email_connections`, `brokers.lead_alias` to `supabase/schema.sql` + run against live project. | Tables exist |
| 2.3 | `/api/inbound/email` | POST with shared-secret header; accepts raw MIME or `{from,subject,text,html}`; idempotent on Message-ID; stores to `inbound_emails`. | Fixture POST → 200 + row |
| 2.4 | Lead Router (`src/lib/lead-router.ts`) | normalize → Gemini extract (few-shot from fixtures, heuristic fallback) → buyer dedupe by phone → property match via `portal_listings` + fuzzy title → **auto-create draft listing** (`createListingFromText`, `needs_clarification` flagged) → score → upsert lead + Realtime broadcast. | Fixture email → correct lead card, attached/created property |
| 2.5 | Dashboard channel UX | Source badge on lead cards (MagicBricks/99acres/…); draft-listing state: "add photos on WhatsApp to finish this card". | Visible per-channel provenance |
| 2.6 | WA alert to broker (needs M1) | On new portal lead: WhatsApp to broker with buyer name/phone/property + link. | Arnav's phone buzzes on fixture ingest |
| 2.7 | Demo simulator button | Hidden dev control: "Simulate a MagicBricks lead" fires a fixture through the pipe — the live-demo trigger when we can't wait for a real portal email on stage. | One click → full cascade on screen |
| 2.8 | Later (post-demo) | Cloudflare Email Routing on the real domain; "Continue with Google" OAuth (Tier 1) with 90-day backfill. Not demo-blocking. | — |

## M3 — Buyer-side WhatsApp loop, Phase 2 (2–3 days, needs M1; template from 1.5)

| # | Task | Detail | Done when |
|---|------|--------|-----------|
| 3.1 | First-touch to buyer | On lead with phone (confirmed visible on Arnav's portal tier): send approved template with Brokly listing link. | Test buyer number receives it |
| 3.2 | Buyer-brief bot | The missing flowchart-② node: buyer replies → bot asks area/BHK/budget conversationally → stores brief → auto-runs match → sends collection link. Reuses `handleBotMessage` routing with a buyer-session path (buyers = numbers that aren't brokers). | Buyer chat yields a brief + link without broker touching anything |
| 3.3 | Durable KV | Upstash keys (free tier) into `.env.local` so share links + conversations survive restarts. **[A]** create Upstash account or hand me the go-ahead to config. | Links survive server restart |
| 3.4 | Broker inbox unification | Buyer-bot threads appear in CRM Inbox with AI-suggested replies (existing engine) — broker takes over anytime. | One inbox shows the whole story |

## M4 — Deploy + demo polish (1–2 days, parallel-izable)

| # | Task | Detail | Done when |
|---|------|--------|-----------|
| 4.1 | Vercel deploy **[A account]** | Production URL; env vars incl. `NEXT_PUBLIC_APP_URL`; **rotate all keys first** (Supabase/Gemini were exposed in old chats — Arnav said he'll change them). Point Meta webhook at prod. | Public URL runs the whole loop |
| 4.2 | OG tags on `/listing/[slug]` | Title/price/cover-photo link previews — this is what makes shared links look premium *inside WhatsApp*. (From gap backlog.) | Rich preview when link pasted in WA |
| 4.3 | Demo-script doc + dry run | `docs/DEMO_SCRIPT.md`: the 7-minute arc with exact taps; I dry-run everything browser-side end-to-end. | Dry run passes clean |
| 4.4 | Nice-to-have if time | Broker storefront `/b/[slug]` minimal page; Money screen fed from real `genInvoice` during script; visits card wired to a real lead. | — |

---

## Dependency graph (what unblocks what)

```
M0 ──────────────────────────────┐
M2.2–2.5, 2.7 (start now) ───────┼──► M2.6 ─┐
[A] Meta keys ──► M1 ────────────┘          ├──► M3 ──► M4.3 dry run ──► DEMO
[A] fixture emails ──► M2.1→2.4             │
[A] Upstash / Vercel / rotations ──► M3.3, M4.1
```

**Everything Arnav owes the plan:** ① Meta app values + webhook click-through, ② 3–5 real portal
lead emails, ③ Upstash + Vercel accounts (or green-light me to set up), ④ approval to wipe
Supabase test data, ⑤ key rotation before anything goes public.

**Execution order when nothing is blocked:** 0.1 → 0.2 → 2.2 → 2.3 → 2.4 → 2.5 → 2.7 → (keys land)
1.2 → 1.4 → 1.5 → 1.6 → 2.6 → 3.1 → 3.2 → 3.3 → 3.4 → 0.3 → 0.4 → 4.1 → 4.2 → 4.3.

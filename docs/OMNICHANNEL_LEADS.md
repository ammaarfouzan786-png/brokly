# Omni-channel Lead Ingestion — Plan

> Goal: a lead born **anywhere** (WhatsApp, MagicBricks, 99acres, Housing, OLX, Instagram,
> Brokly links, a phone call) becomes **one scored lead card** on Brokly, attached to the right
> property (auto-creating the listing card if it doesn't exist), and the entire buyer↔broker
> conversation then moves to **WhatsApp + Brokly links** — the portals are only ever the first touch.

Diagrams: [`diagrams/omnichannel-lead-router.mermaid`](diagrams/omnichannel-lead-router.mermaid) ·
[`diagrams/portal-email-lead-sequence.mermaid`](diagrams/portal-email-lead-sequence.mermaid) ·
[`diagrams/brokly-end-to-end-journey.mermaid`](diagrams/brokly-end-to-end-journey.mermaid)
(each has a rendered `.svg` next to it — drag-drop into Miro/Lucidchart).

## The two insights that make this tractable

1. **Email is the universal adapter.** MagicBricks, 99acres, Housing, OLX — none of them offer a
   public lead API to an individual broker, but **every one of them emails the broker on every
   enquiry**, and those emails contain the buyer's name/phone and the listing reference. If Brokly
   can receive and parse that email, we've integrated every portal at once — no partnerships, no
   scraping, no ToS risk (the broker owns those emails).
2. **One Meta app covers WhatsApp AND Instagram.** The same Meta Business app we're setting up for
   the WhatsApp Cloud API also serves the Instagram Messaging API (DMs), comment webhooks, and the
   Lead Ads API. One approval process, one webhook infrastructure, two channels.

## Architecture: the Lead Router

One pipeline, many inlets — the same pattern as `handleBotMessage()` being engine-agnostic:

```
inlets                                  pipeline                          outcomes
──────                                  ────────                          ────────
/api/webhook/whatsapp   (exists)   →                                  →  lead card (Supabase + Realtime)
/api/inbound/email      (new)      →   normalize → Gemini parse  →    →  WhatsApp alert to broker
/api/webhook/instagram  (new)      →   dedupe buyer → match property  →  WhatsApp first-touch to buyer
/api/enquiry, /api/leads (exists)  →   (auto-create card) → AI score  →  conversation in unified inbox
manual quick-add        (exists)   →
```

**Pipeline stages** (new `src/lib/lead-router.ts`):

1. **Normalize** — every inlet maps its payload to one `IncomingLead { channel, raw, buyerName?,
   buyerPhone?, buyerEmail?, listingRef?, message?, receivedAt }`.
2. **Parse** — Gemini structured extraction with per-source few-shot examples (real MB/99acres/
   Housing notification emails as fixtures); heuristic regex fallback like `parser.mjs`.
3. **Identity dedupe** — same phone/email across channels = one buyer; a repeat enquiry bumps the
   existing lead's score instead of creating a duplicate row.
4. **Property match** — resolve `listingRef` against a new `portal_listings` map (portal +
   external title/id → `property_id`); if unresolved, fuzzy-match by title/area via Gemini against
   the broker's stock; **if still no match, auto-create a draft listing card** from the property
   details in the email (reusing `createListingFromText`) — this is the "new card created" goal.
5. **Score** — existing HOT/WARM/COLD scoring, enriched with channel weight (portal enquiry with
   phone number ≈ high intent).
6. **Act** — upsert lead (Realtime broadcast, exists) · WhatsApp alert to the broker · WhatsApp
   first-touch template to the buyer with the Brokly listing link (Phase 2).

**Schema additions** (`supabase/schema.sql`):

- `inbound_emails(id, broker_id, from_addr, subject, raw_mime, parsed, status, message_id unique)` — audit + idempotency.
- `portal_listings(id, broker_id, portal, external_ref, property_id)` — the portal↔Brokly map.
- `brokers.lead_alias` — the unique inbound address, e.g. `arnav-4821@leads.brokly.in`.
- `leads.source` already exists — extend values: `magicbricks | 99acres | housing | olx | instagram | ig_ads | whatsapp | link | manual`.

## Phases

| # | Slice | What ships | Effort |
|---|-------|-----------|--------|
| 1 | **Email ingestion** (universal portal adapter) | Cloudflare Email Routing (free) on `leads.brokly.in` → Worker → `POST /api/inbound/email` (shared-secret header). Unique alias per broker. Gemini email parser + fixtures from real portal emails. Lead card + property match/auto-create. Dev simulator: `POST /api/inbound/email` with fixture `.eml` files — testable before DNS exists. | 2–3 days |
| 2 | **WhatsApp-first comms loop** | Meta utility template `property_enquiry_details` ("You enquired about {{1}} on {{2}} — full details: {{3}}"). Buyer's reply opens the 24h window → buyer-side bot captures brief (area/BHK/budget — the missing ② BOT node from Brokly_flow) → thread lands in broker's unified inbox. Broker alert message with quick actions. | 2–3 days |
| 3 | **Instagram** | Same Meta app: IG DM webhooks → Router; comment triggers ("price", "details") → auto-DM with Brokly link; Lead Ads webhook → Router; bio link → broker storefront `/b/[slug]` (slug already in schema). | 3–5 days |
| 4 | **Deeper portal ties + outward syndication** | Official lead-push APIs where the broker's paid portal plan offers them (99acres/Housing CRM push, MB partner feed) — replaces email parsing per-account when available. Outward: portals have no public write API, so stay honest — Marketing studio generates portal-ready copy + photo pack per listing; optional browser extension prefills the MB/99 posting form. | ongoing |

**Cross-cutting (lands with Phase 1):** per-channel lead analytics — "3 of your last 10 closings
came from 99acres, 6 from your own links" — the **portal-ROI moat feature**; channel badge on every
lead card; graceful behavior when the portal masks the buyer's number (lead card says "reply via
portal" instead of a broken WA button).

## How brokers link their email (Phase 1) — three tiers

> Constraint: at signup the broker gives us only **email + phone**. Everything else must be
> automatic or one-tap. Diagram: [`diagrams/email-linking-flow.mermaid`](diagrams/email-linking-flow.mermaid).

### Tier 1 — "Continue with Google" (the default; zero manual steps)

~95% of Indian brokers run their portal accounts on Gmail. So the moment they type their email:

1. **Detect the provider** from the address/MX record (gmail.com / Google Workspace → Google;
   outlook/hotmail → Microsoft; anything else → Tier 2).
2. Show one button: **"Connect your inbox — leads import automatically."** Tapping it opens the
   standard Google OAuth consent (works identically in the PWA on a phone and on desktop web —
   it's a browser redirect, no native app needed). Scope: `gmail.readonly`.
3. On grant, Brokly stores the refresh token (encrypted) and immediately:
   - **Backfills**: searches the last 90 days for `from:(magicbricks.com OR 99acres.com OR
     housing.com OR olx.in)`, parses every hit, and shows the wow moment — *"We found 23 buyer
     leads sitting in your inbox. 9 are from listings not yet on Brokly — create the cards?"*
   - **Subscribes to new mail**: `users.watch()` → Gmail pushes to a Google Cloud **Pub/Sub**
     topic → push subscription POSTs to `/api/inbound/gmail` → `history.list` diff → only
     portal-sender messages are fetched → Lead Router. Latency: seconds. (The watch expires
     every 7 days — a cron renews it. A 2-minute `messages.list` poll is the belt-and-braces
     fallback.)
4. **Privacy guarantees, enforced in code**: the query filter means we only ever fetch emails
   from known portal domains — never personal mail; raw MIME is stored only for matched
   messages; tokens are encrypted and revocable from Settings; every fetched email appears in a
   visible activity log. (DPDP-friendly posture.)

Same pattern for Outlook via Microsoft Graph (`Mail.Read` + change-notification webhooks).

**Google app verification (honest caveat):** `gmail.readonly` is a *restricted* scope. While the
OAuth app is unverified we can run up to 100 explicitly-added test users — perfect for the pilot
cohort. Scaling past that requires Google's verification (and eventually a CASA security
assessment) — a known, budgetable process every email-reading CRM (e.g. Privyr) has done.

### Tier 2 — the personal lead alias (fallback, still near-zero friction)

If OAuth is declined or the provider is exotic, the broker gets `arnav-4821@leads.brokly.in`
(Cloudflare Email Routing → worker → `/api/inbound/email`). Two one-time ways to wire it:

- **Best:** set the alias as the notification email inside the portal's account settings.
- **Easiest:** a Gmail auto-forward rule for portal senders. Gmail demands the forwarding
  destination confirm via a code — **but the destination is our alias, so Brokly receives that
  confirmation email itself and auto-verifies**. The broker only creates the filter (guided,
  with screenshots; note: Gmail filters need desktop web — the Gmail phone app can't create them).

### Tier 3 — portal settings direct

For brokers on paid portal plans, changing the portal's notification email to the alias is the
cleanest permanent wiring — no personal inbox in the loop at all. We show this as the "pro" option.

**Web app or phone app?** Both, because Brokly is an installable PWA — the OAuth redirect and
every fallback screen work in the phone browser exactly as on desktop. No native app is required
for any tier.

**Schema addition:** `email_connections(broker_id, provider, email, refresh_token_enc,
history_id, watch_expiry, status, last_sync_at)`.

## Risks & honesty notes

- **Masked buyer numbers**: free portal tiers often mask the phone. Parser stores what exists;
  lead card degrades to "respond via portal" + we still log the property interest signal.
- **First-touch consent**: the buyer gave their number to the portal to be contacted about that
  property. The template must reference that context, identify the broker, and keep a neutral
  utility tone — that's also what gets it approved by Meta.
- **Template cost**: utility templates in India are ~₹0.12/message — negligible; replies within
  the 24h window are free.
- **No scraping**: we never scrape portal dashboards; we only parse emails the broker owns and use
  official APIs where they exist. Keeps Brokly clean with the portals long-term.
- **Email deliverability edge**: some portals send via no-reply domains with strict DMARC —
  auto-forward from Gmail preserves the body (what we parse), so this is safe; direct alias
  registration avoids it entirely.

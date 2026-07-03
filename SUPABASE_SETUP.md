# Supabase setup (listings, leads, live dashboard, media)

The WhatsApp-bot listing engine (parser → listings → live leads → `/dashboard`) is backed by
**Supabase** (Postgres + Realtime + Storage). Without it, those features show a "Connect Supabase"
prompt and the rest of the app still runs.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **SQL Editor → New query →** paste & run [`supabase/schema.sql`](supabase/schema.sql).
   This creates `brokers`, `properties`, `collections`, `leads`, `messages`, `wa_sessions`,
   `wa_processed`, enables RLS, and turns on Realtime for `leads`/`messages`/`properties`.
3. **Storage → New bucket →** name it **`listing-media`**, mark it **Public**. (Inbound WhatsApp
   photos/videos and uploads are stored here and become the listing gallery.)
4. **Settings → API →** copy the **Project URL**, the **anon** key, and the **service_role** key.

## 2. Configure `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...        # anon / publishable
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...            # service_role / secret (server only)
NEXT_PUBLIC_APP_URL=http://localhost:3000        # your public URL in prod

# Optional — better parsing. Without it, a heuristic fallback is used.
GEMINI_API_KEY=AIza...
# GEMINI_MODEL=gemini-2.5-pro
```

Restart `npm run dev`. `/dashboard` will drop the setup card and go live.

## 3. Try it (no WhatsApp needed)

1. Open **`/new`**, keep the prefilled pub sample (or paste your own messy property text), add your
   WhatsApp number, hit **Generate**.
2. Open the resulting **`/listing/<slug>`** — a polished Airbnb-style page.
3. Tap **Enquire on WhatsApp** → the lead appears **instantly** on **`/dashboard`** (Realtime).

To wire the actual WhatsApp bot, see [`OPENWA_SETUP.md`](./OPENWA_SETUP.md) (fast, QR-based) or
[`WHATSAPP_SETUP.md`](./WHATSAPP_SETUP.md) (official Cloud API).

## How it maps to code

| Piece | File |
| --- | --- |
| Clients (admin + browser) | `src/lib/supabase.ts` |
| Listing parser (Gemini + fallback) | `src/lib/parser.mjs` |
| Create listing / leads | `src/lib/db.ts` |
| Media → Storage bucket | `src/lib/storage.ts` |
| Live leads broadcast | `src/lib/realtime.ts` + `src/app/dashboard/LeadsLive.tsx` |
| Listing page / create / dashboard | `src/app/listing/[slug]`, `/new`, `/dashboard` |
| APIs | `/api/parse`, `/api/listings`, `/api/leads` |

> RLS: the browser can only read published listings/collections; leads/messages/sessions are
> service-role only. The dashboard receives leads via Realtime **Broadcast** (not `postgres_changes`)
> precisely because of that RLS.

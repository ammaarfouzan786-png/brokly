# WhatsApp bot via OpenWA (fast, QR-based)

The listing bot is **engine-agnostic**: both OpenWA and the official Cloud API normalise their
payload into one `handleBotMessage()` flow (`src/lib/bot.ts`). OpenWA automates a *normal* WhatsApp
number by scanning a QR — live in minutes, perfect for a demo.

> ⚠️ OpenWA is **unofficial** (against WhatsApp's ToS — ban risk at scale). Use it for prototyping;
> switch to the **Cloud API** for production (see [`WHATSAPP_SETUP.md`](./WHATSAPP_SETUP.md)).

## 1. Prerequisites

- [Supabase configured](./SUPABASE_SETUP.md) (the bot persists sessions + listings there).
- A spare WhatsApp number to link.
- A public HTTPS URL for the webhook (deploy, or tunnel with `npx ngrok http 3000`).

## 2. Run the OpenWA gateway

Run an OpenWA server (e.g. the `@open-wa/wa-automate` Docker image or a hosted instance). Start a
session (default id `brokly`) and **scan the QR** with the number you want the bot to run on.

## 3. Configure `.env.local`

```bash
OPENWA_BASE_URL=http://localhost:2785     # your OpenWA gateway
OPENWA_SESSION_ID=brokly
OPENWA_API_KEY=...                        # if your gateway requires X-API-Key
OPENWA_WEBHOOK_SECRET=some-long-secret    # HMAC secret shared with the webhook
NEXT_PUBLIC_APP_URL=https://your-app      # used to build listing links
```

## 4. Point OpenWA's webhook at Brokly

Configure the gateway to POST **`message.received`** events to:

```
https://<your-app>/api/webhook/openwa
```

with header `X-OpenWA-Signature: sha256=<hmac-sha256(rawBody, OPENWA_WEBHOOK_SECRET)>`.
Brokly verifies the HMAC and de-dupes retries via the `wa_processed` table.

## 5. The magic moment

1. WhatsApp **"Hi"** to the linked number → bot greets with instructions.
2. Forward the property **text + photos/videos** (any order). The bot buffers them (photos upload
   to the `listing-media` bucket).
3. Type **DONE** → in ~30s the bot replies with a **`/listing/<slug>`** link + a share caption.
4. Forward that link to a buyer → they tap **Enquire on WhatsApp** → the lead lands **live** on
   `/dashboard`.

## Switching to the official Cloud API

Everything above works identically through `src/app/api/webhook/whatsapp/route.ts` — just set the
Meta env vars from [`WHATSAPP_SETUP.md`](./WHATSAPP_SETUP.md) and point Meta's webhook there instead.
No bot logic changes.

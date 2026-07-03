# WhatsApp Cloud API setup

Brokly integrates the **official Meta WhatsApp Cloud API**. Without credentials it runs in **demo
mode** (sends are simulated, the inbox still works). Add credentials to go **live** — two-way
messaging with real WhatsApp numbers.

## 1. Create the app + number (Meta)

1. Go to [developers.facebook.com](https://developers.facebook.com/) → **My Apps** → **Create App**
   → type **Business**.
2. Add the **WhatsApp** product to the app.
3. In **WhatsApp → API Setup** you get a **test phone number** and a temporary token. Note the
   **Phone number ID** (not the phone number itself).
4. For production, add and verify your own business phone number and generate a **permanent access
   token** via a **System User** (Business Settings → Users → System Users → Generate token, with
   `whatsapp_business_messaging` + `whatsapp_business_management` scopes).

## 2. Configure `.env.local`

Create `.env.local` in the project root:

```bash
WHATSAPP_TOKEN=EAAG...                 # permanent/system-user access token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=brokly-verify    # any string you choose (used in step 3)
WHATSAPP_APP_SECRET=abc123...          # optional: App Settings → Basic → App Secret
# WHATSAPP_API_VERSION=v21.0           # optional, defaults to v21.0
```

Restart `npm run dev`. The Inbox header will switch from *"Demo mode"* to *"● Live"*.

## 3. Register the webhook

Meta must reach your server over HTTPS. Locally, expose it with a tunnel:

```bash
npx ngrok http 3000       # or cloudflared / your own domain
```

In **WhatsApp → Configuration → Webhook**:

- **Callback URL:** `https://<your-domain>/api/whatsapp/webhook`
- **Verify token:** the exact value of `WHATSAPP_VERIFY_TOKEN`
- Click **Verify and save** (Brokly answers the `hub.challenge` handshake).
- **Subscribe** to the **`messages`** field.

Send a WhatsApp message to your business number — it appears in the Brokly **Inbox** within a few
seconds (the app polls `/api/whatsapp/messages`).

## How it works

| Piece | File |
| --- | --- |
| Send / template + demo fallback | `src/lib/whatsapp.ts` |
| Webhook (verify + inbound + signature check) | `src/app/api/whatsapp/webhook/route.ts` |
| Outbound send endpoint | `src/app/api/whatsapp/send/route.ts` |
| Inbound queue (in-memory) | `src/lib/server-store.ts` + `/api/whatsapp/messages` |
| Live/demo status for the UI | `src/app/api/whatsapp/status/route.ts` |

## Notes

- **24-hour window:** businesses can only free-text a user within 24h of their last message.
  Outside it, you must send a **pre-approved template** (`sendTemplate` in `src/lib/whatsapp.ts`).
- **Signature check:** set `WHATSAPP_APP_SECRET` to verify `X-Hub-Signature-256` on the webhook.
- **Scaling:** the inbound queue is process-local (in-memory). For multiple instances, back it with
  Redis or Postgres.
- **Secrets:** `.env.local` is git-ignored — never commit real tokens.

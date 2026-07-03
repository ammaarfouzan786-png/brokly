// Official WhatsApp Cloud API (Meta Graph API) client — server only.
//
// Configure via .env.local:
//   WHATSAPP_TOKEN            — permanent/system-user access token
//   WHATSAPP_PHONE_NUMBER_ID  — the Cloud API phone number id
//   WHATSAPP_VERIFY_TOKEN     — arbitrary string, must match the value you set
//                               in the Meta webhook config
//   WHATSAPP_APP_SECRET       — (optional) app secret, enables X-Hub signature
//                               verification on the webhook
//   WHATSAPP_API_VERSION      — (optional) defaults to v21.0
//
// When TOKEN + PHONE_NUMBER_ID are absent, sends are *simulated* so the whole
// app runs end-to-end in demo mode and flips to live the moment you add creds.

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

export const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'brokly-verify';
export const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

export function isConfigured(): boolean {
  return Boolean(TOKEN && PHONE_NUMBER_ID);
}

export interface SendResult {
  live: boolean; // true = actually dispatched through Meta
  id?: string;
  error?: string;
}

const graphUrl = () =>
  `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

/** Send a plain text WhatsApp message. Falls back to a simulated result when unconfigured. */
export async function sendText(to: string, text: string): Promise<SendResult> {
  const toDigits = (to || '').replace(/\D/g, '');
  if (!isConfigured()) {
    return { live: false, id: 'sim_' + Math.random().toString(36).slice(2, 10) };
  }
  try {
    const res = await fetch(graphUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toDigits,
        type: 'text',
        text: { preview_url: true, body: text },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { live: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { live: true, id: data?.messages?.[0]?.id };
  } catch (e) {
    return { live: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

/**
 * Send a pre-approved template (needed for business-initiated messages outside
 * the 24h customer-service window). Provided for completeness.
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode = 'en',
  components?: unknown[],
): Promise<SendResult> {
  const toDigits = (to || '').replace(/\D/g, '');
  if (!isConfigured()) return { live: false, id: 'sim_' + Math.random().toString(36).slice(2, 10) };
  try {
    const res = await fetch(graphUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toDigits,
        type: 'template',
        template: { name: templateName, language: { code: languageCode }, components },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { live: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { live: true, id: data?.messages?.[0]?.id };
  } catch (e) {
    return { live: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

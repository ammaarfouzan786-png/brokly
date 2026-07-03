// Server -> dashboard live updates via Supabase Realtime *Broadcast* (stateless HTTP,
// serverless-friendly). Broadcast (not postgres_changes) because `leads` has RLS with no
// anon SELECT, so postgres_changes would be filtered out for the browser's anon key.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const LEADS_TOPIC = 'leads-stream';

export async function broadcastLead(lead: unknown): Promise<void> {
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ topic: LEADS_TOPIC, event: 'new_lead', payload: { lead } }] }),
    });
  } catch (e) {
    console.error('broadcastLead failed', e instanceof Error ? e.message : e);
  }
}

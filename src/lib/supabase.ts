import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;

/** True when the server can talk to Supabase (service role present). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

/** Server-only admin client (service role) — bypasses RLS. Never import in a client component. */
export function supabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error('Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Public anon client (browser) — Realtime subscriptions + reading published listings. */
export function supabaseBrowser(): SupabaseClient {
  return createClient(url, anonKey);
}

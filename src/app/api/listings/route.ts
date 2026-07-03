import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { createListingFromText, ensureBroker } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { text, media?, brokerPhone?, brokerName? } -> create a listing, return its public URL.
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const { text, media = [], brokerPhone, brokerName } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });
    let brokerId: string | undefined;
    if (brokerPhone) brokerId = (await ensureBroker({ phone: brokerPhone, name: brokerName }))?.id;
    const listing = await createListingFromText({ text, brokerId, media });
    const base = process.env.NEXT_PUBLIC_APP_URL || '';
    return NextResponse.json({ listing, url: `${base}/listing/${listing.slug}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'create failed' }, { status: 500 });
  }
}

// GET ?broker=<id> -> that broker's listings (most recent first).
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ listings: [] });
  const { searchParams } = new URL(req.url);
  const broker = searchParams.get('broker');
  const db = supabaseAdmin();
  let q = db.from('properties').select('*').order('created_at', { ascending: false }).limit(100);
  if (broker) q = q.eq('broker_id', broker);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data });
}

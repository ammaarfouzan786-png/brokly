import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { upsertLeadFromEnquiry } from '@/lib/db';

export const runtime = 'nodejs';

// GET ?broker=<id> -> leads for the dashboard.
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ leads: [] });
  const { searchParams } = new URL(req.url);
  const broker = searchParams.get('broker');
  const db = supabaseAdmin();
  let q = db.from('leads').select('*, properties(title,slug,cover_url)').order('last_msg_at', { ascending: false }).limit(200);
  if (broker) q = q.eq('broker_id', broker);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

// POST { propertyId, phone, name?, message? } -> record an enquiry (listing "Enquire" fallback).
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const { propertyId, phone, name, message } = await req.json();
    if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });
    const db = supabaseAdmin();
    let brokerId: string | undefined;
    if (propertyId) {
      const { data: prop } = await db.from('properties').select('broker_id').eq('id', propertyId).maybeSingle();
      brokerId = prop?.broker_id || undefined;
    }
    const lead = await upsertLeadFromEnquiry({ brokerId, propertyId, phone, name, message });
    return NextResponse.json({ lead });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'record failed' }, { status: 500 });
  }
}

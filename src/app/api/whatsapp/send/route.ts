import { NextRequest, NextResponse } from 'next/server';
import { sendText, isConfigured } from '@/lib/whatsapp';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { to, text } = await req.json().catch(() => ({}) as { to?: string; text?: string });
  if (!to || !text) {
    return NextResponse.json({ error: 'missing "to" or "text"' }, { status: 400 });
  }
  const result = await sendText(String(to), String(text));
  return NextResponse.json({ ...result, configured: isConfigured() });
}

import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/whatsapp';
import { isDurable } from '@/lib/kv';

export const runtime = 'nodejs';

/** Lets the UI show whether WhatsApp is live or running in demo mode. */
export function GET() {
  return NextResponse.json({ configured: isConfigured(), durable: isDurable() });
}

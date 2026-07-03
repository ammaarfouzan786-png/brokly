import { NextResponse } from 'next/server';
import { sendText, readInbound, verifySignature } from '@/lib/openwa';
import { handleBotMessage } from '@/lib/bot';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Adapter: OpenWA (self-hosted QR gateway) -> shared listing bot.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-openwa-signature'), process.env.OPENWA_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const { from, chatId, text, media, fromMe, event, isGroup, isStatus } = readInbound(payload);
  if (event && !/message/i.test(event)) return NextResponse.json({ ok: true });

  await handleBotMessage(
    {
      from: from || '',
      replyTo: chatId,
      text,
      media,
      fromMe,
      isGroup,
      isStatus,
      messageId: (payload as { idempotencyKey?: string; data?: { id?: string } })?.idempotencyKey || (payload as { data?: { id?: string } })?.data?.id,
    },
    sendText,
  );
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, bot: 'brokly-openwa' });
}

import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';
import { SEED_PULSE, PULSE_SYSTEM, type PulseItem } from '@/lib/pulse';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TAB_COLOR: Record<string, string> = { Market: '#0B6B3A', 'Area signals': '#E0473C', Network: '#12925A' };

function withColor(it: Partial<PulseItem>): PulseItem {
  const tab = (['Market', 'Area signals', 'Network'] as const).includes(it.tab as never) ? (it.tab as PulseItem['tab']) : 'Market';
  return {
    color: TAB_COLOR[tab],
    label: it.label || '📰 MARKET',
    title: it.title || '',
    body: it.body || '',
    act: it.act || 'Read more',
    tab,
  };
}

// POST { city?, areas? } -> a fresh market pulse (Gemini), or the seed feed.
export async function POST(req: Request) {
  try {
    const { city = 'Bengaluru', areas = [] } = await req.json().catch(() => ({}));
    const areaList = (areas as string[]).filter(Boolean);
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `Today is ${today}. City: ${city}. Broker's active areas: ${areaList.join(', ') || 'Whitefield, Sarjapur, Indiranagar'}. Generate today's market pulse for this broker. Frame items around the current period — never cite quarters/years older than this date.`;
    let text: string | null = null;
    try {
      text = await generateText(prompt, { system: PULSE_SYSTEM, json: true, temperature: 0.9 });
    } catch {
      text = null;
    }
    if (text) {
      try {
        const parsed = JSON.parse(text);
        const items = (parsed.items || []).map(withColor).filter((i: PulseItem) => i.title);
        if (items.length) return NextResponse.json({ items, source: 'ai' });
      } catch {
        /* fall through */
      }
    }
    return NextResponse.json({ items: SEED_PULSE, source: 'fallback' });
  } catch {
    return NextResponse.json({ items: SEED_PULSE, source: 'fallback' });
  }
}

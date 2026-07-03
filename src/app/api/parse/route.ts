import { NextResponse } from 'next/server';
import { parseListing } from '@/lib/parser.mjs';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { text } -> structured listing JSON (preview only, no DB write).
// Uses Gemini when GEMINI_API_KEY is set, else the heuristic fallback.
export async function POST(req: Request) {
  try {
    const { text, model } = await req.json();
    if (!text || typeof text !== 'string') return NextResponse.json({ error: 'text required' }, { status: 400 });
    const parsed = await parseListing(text, {
      apiKey: process.env.GEMINI_API_KEY,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    });
    return NextResponse.json({ parsed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'parse failed' }, { status: 500 });
  }
}

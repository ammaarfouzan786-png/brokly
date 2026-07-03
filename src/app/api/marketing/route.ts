import { NextResponse } from 'next/server';
import { templateById, fillPrompt, fallbackOutput, COPY_SYSTEM } from '@/lib/marketing';
import { generateText } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { templateId, vars } -> generated marketing content.
export async function POST(req: Request) {
  try {
    const { templateId, vars = {} } = await req.json();
    const tpl = templateById(templateId);
    if (!tpl) return NextResponse.json({ error: 'unknown template' }, { status: 400 });

    // AI-media prompts are meant to be copied into external tools, not generated here.
    if (tpl.copyOnly) {
      return NextResponse.json({ text: fillPrompt(tpl, vars), source: 'template' });
    }

    const prompt = fillPrompt(tpl, vars);
    let text: string | null = null;
    try {
      text = await generateText(prompt, { system: COPY_SYSTEM, temperature: 0.85 });
    } catch (e) {
      console.error('marketing gen failed', e instanceof Error ? e.message : e);
      text = null;
    }
    if (!text) return NextResponse.json({ text: fallbackOutput(tpl, vars), source: 'fallback' });
    return NextResponse.json({ text, source: 'ai' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}

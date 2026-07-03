// Free-text Gemini generation (marketing copy, market pulse). Structured listing
// parsing lives in parser.mjs; this is for creative/long-form text.

export interface GenerateOpts {
  apiKey?: string;
  model?: string;
  system?: string;
  temperature?: number;
  json?: boolean;
}

/**
 * Returns generated text, or null when no API key is configured (callers then
 * use a local fallback so the feature still works in demo mode).
 */
export async function generateText(prompt: string, opts: GenerateOpts = {}): Promise<string | null> {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = opts.model || process.env.GEMINI_MODEL_FAST || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.8,
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error('Gemini: ' + data.error.message);
  return (data.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('').trim();
}

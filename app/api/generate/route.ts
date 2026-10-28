import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY in .env.local' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = body.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    let prompt = body.prompt;
    if (!prompt && body.contents) {
      // Support standard Gemini curl payload format
      const parts = body.contents?.[0]?.parts;
      if (Array.isArray(parts)) {
        prompt = parts.map((p: { text?: string }) => p.text || '').filter(Boolean).join('\n');
      }
    }

    if (!prompt) {
      prompt = 'Explain how AI works in a few words';
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return NextResponse.json({
      text: response.text,
      model,
      prompt,
      candidates: [
        {
          content: {
            parts: [{ text: response.text }],
            role: 'model',
          },
          finishReason: 'STOP',
        },
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/generate',
    instructions: 'Send a POST request with { prompt: "..." } or the standard Gemini contents payload.',
    defaultPrompt: 'Explain how AI works in a few words',
  });
}

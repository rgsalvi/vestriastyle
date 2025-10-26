import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const { base64, mimeType } = req.body as { base64?: string; mimeType?: string };
    if (!base64 || !mimeType) return res.status(400).json({ message: 'Missing image' });

    const imagePart = { inlineData: { data: base64, mimeType } } as any;
    const textPart = { text: `You are a validator. Analyze if this photo shows a single person full-length (head to feet), mostly front-facing, in clear lighting with minimal background clutter. Respond in strict JSON only with keys: ok (boolean), reasons (string[]), tips (string[]).` } as any;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    const text = (response as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text)?.filter(Boolean)?.join(' ') || '';
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    if (!parsed || typeof parsed.ok !== 'boolean') {
      return res.status(200).json({ ok: true, reasons: [], tips: [] });
    }
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('validate-full-body error', error);
    return res.status(200).json({ ok: true, reasons: [], tips: [] });
  }
}

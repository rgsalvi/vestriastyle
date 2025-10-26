import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type ImageRef = { base64: string; mimeType: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
  const { person, flatLay, size, strict, region } = req.body as { person?: ImageRef; flatLay?: ImageRef; size?: { width: number; height: number }; strict?: boolean; region?: 'full' | 'upper' };
    if (!person?.base64 || !person?.mimeType) {
      return res.status(400).json({ message: 'person image is required' });
    }
    if (!flatLay?.base64 || !flatLay?.mimeType) {
      return res.status(400).json({ message: 'flatLay image is required' });
    }

    // Single-pass try-on: replace all clothing on the person using the products visible in the flat lay image.
    // Preserve the original face and background exactly; maintain pose and lighting.
    const constraint = `
RULES (NO EXCEPTIONS):
- Use ONLY and ALL garments visible in the flat lay. Do NOT add any new items (no belts, no jewelry, no hats, no extra graphics, no text, no logos beyond what exists).
- Do NOT alter colors, patterns, logos, or prints. Reproduce them exactly.
- Preserve the person's original face, hair, skin, and background exactly.
- Maintain body pose and lighting; avoid edge artifacts (hands, neckline, hems).
- If a body region has no corresponding flat lay item, do NOT invent a garment for it; leave the original region unmodified where feasible rather than adding anything new.`;

    const stricter = `
ADDITIONAL STRICTNESS:
- Zero tolerance for hallucinated accessories or fabricated details.
- If uncertain, prefer leaving an area unchanged instead of adding or modifying it.
`;

    const regionScope = region === 'upper'
      ? 'LIMIT EDITS TO UPPER-BODY GARMENTS ONLY (tops, jackets). Do not modify any lower-body garments.'
      : 'Replace all visible clothing.';

    const instruction = `Using only the garments in the flat lay image, ${regionScope} Ensure realistic fit and drape while strictly adhering to the rules.
${constraint}
${strict ? stricter : ''}
OUTPUT: One high-quality portrait of the person dressed ONLY in the flat lay items, with no extra additions.`;

    const parts: any[] = [
      { inlineData: { data: person.base64, mimeType: person.mimeType } },
      { inlineData: { data: flatLay.base64, mimeType: flatLay.mimeType } },
      { text: instruction },
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    const candidates = (response as any)?.candidates as Array<any> | undefined;
    const outParts = candidates?.[0]?.content?.parts as Array<any> | undefined;
    if (Array.isArray(outParts)) {
      const inputs = new Set([person.base64, flatLay.base64]);
      const images = outParts.filter(p => p?.inlineData?.data).map(p => ({ base64: p.inlineData.data as string, mimeType: p.inlineData.mimeType || 'image/jpeg' }));
      const candidatesOut = images.filter(img => !inputs.has(img.base64));
      const finalOut = candidatesOut[candidatesOut.length - 1] || images[images.length - 1] || null;
      if (finalOut) {
        return res.status(200).json({ base64Image: finalOut.base64, mimeType: finalOut.mimeType });
      }
    }
    throw new Error('No generated image in response');
  } catch (error) {
    console.error('Error generating try-on:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to generate try-on.', error: msg });
  }
}

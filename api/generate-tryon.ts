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
  const { person, flatLay, size, strict, region, cleanup } = req.body as { person?: ImageRef; flatLay?: ImageRef; size?: { width: number; height: number }; strict?: boolean; region?: 'full' | 'upper' | 'lower'; cleanup?: boolean };
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
- If a body region has no corresponding flat lay item, do NOT invent a garment for it; leave the original region unmodified where feasible rather than adding anything new.
- Ensure there is NO double-layering. Where the new garment reveals skin (e.g., shorts replacing trousers), REMOVE the original garment entirely within that region and synthesize realistic, consistent skin and edges matching the person's tone and lighting.`;

    const stricter = `
ADDITIONAL STRICTNESS:
- Zero tolerance for hallucinated accessories or fabricated details.
- If uncertain, prefer leaving an area unchanged instead of adding or modifying it.
`;

    const regionScope = region === 'upper'
      ? 'LIMIT EDITS TO UPPER-BODY GARMENTS ONLY (tops, jackets). Do not modify any lower-body garments. REMOVE any original upper-body garment fully so it does not show under the new item.'
      : region === 'lower'
        ? 'LIMIT EDITS TO LOWER-BODY GARMENTS ONLY (pants, skirts, shorts). Do not modify any upper-body garments. REMOVE any original lower-body garment fully so it does not show under the new item. If the person is wearing a dress or one-piece, remove only the lower portion necessary to fit the provided bottoms; DO NOT add or invent any top.'
        : 'Replace all visible clothing. REMOVE original garments fully in their respective regions so none of the old clothing shows under the new items.';

  const instruction = `Using only the garments in the flat lay image, ${regionScope} Ensure realistic fit and drape while strictly adhering to the rules.
${constraint}
${strict ? stricter : ''}
OUTPUT FORMAT (MANDATORY):
- Output ONLY a single edited portrait photo.
- DO NOT include side-by-side comparisons, before/after, grids, frames, borders, picture-in-picture, or any duplication of the original image within the output.
- DO NOT include the flat lay or the original person photo in the frame; use them strictly as references.
- The result should look like a single natural photograph of the person wearing ONLY the flat lay items.`;

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
    let finalOut: ImageRef | null = null;
    if (Array.isArray(outParts)) {
      const inputs = new Set([person.base64, flatLay.base64]);
      const images = outParts.filter(p => p?.inlineData?.data).map(p => ({ base64: p.inlineData.data as string, mimeType: p.inlineData.mimeType || 'image/jpeg' }));
      const candidatesOut = images.filter(img => !inputs.has(img.base64));
      finalOut = candidatesOut[candidatesOut.length - 1] || images[images.length - 1] || null;
    }
    if (!finalOut) throw new Error('No generated image in response');

    // Optional cleanup pass to eliminate remnants of original garments (e.g., trousers under shorts)
    if (cleanup !== false) {
      try {
        const cleanupParts: any[] = [
          { inlineData: { data: finalOut.base64, mimeType: finalOut.mimeType } },
          { text: `REFINE ONLY (do not change or add garments):
- Remove any visible remnants of original clothing beneath hems, waistbands, or sleeves.
- Ensure there is no double-layering under the new items.
- Smooth and blend edges; maintain skin continuity where revealed, matching tone and lighting.
- Preserve all current garments as they are, the person's face, hair, skin features, and the background exactly.
- Do NOT change colors, prints, or shapes of garments present.` }
        ];
        const refine = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts: cleanupParts },
          config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const rCandidates = (refine as any)?.candidates as Array<any> | undefined;
        const rParts = rCandidates?.[0]?.content?.parts as Array<any> | undefined;
        if (Array.isArray(rParts)) {
          const imgs = rParts.filter(p => p?.inlineData?.data).map(p => ({ base64: p.inlineData.data as string, mimeType: p.inlineData.mimeType || 'image/jpeg' }));
          const refined = imgs[imgs.length - 1];
          if (refined) finalOut = refined;
        }
      } catch (e) {
        // Best-effort cleanup
      }
    }
    return res.status(200).json({ base64Image: finalOut.base64, mimeType: finalOut.mimeType });
  } catch (error) {
    console.error('Error generating try-on:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to generate try-on.', error: msg });
  }
}

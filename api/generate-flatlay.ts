import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

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
    const { source } = req.body as { source?: { base64: string; mimeType: string } };
    if (!source?.base64 || !source?.mimeType) {
      return res.status(400).json({ message: 'source image is required' });
    }

    // Single-image extraction: remove model if present, isolate each visible clothing item,
    // and arrange them into one clean overhead flat lay.
    const parts: any[] = [
      { inlineData: { data: source.base64, mimeType: source.mimeType } },
      { text: `TASK: Create a single overhead flat lay image containing ONLY the clothing products that are actually visible in the provided photo.

STRICT REQUIREMENTS:
- If a model/person is present, remove them completely; keep only the garments.
- Do NOT invent, add, or alter any items. No accessories unless clearly present. No hallucinated logos, graphics, or extra details.
- Preserve each product's exact color, pattern/print, silhouette, and material appearance.
- If parts of an item are occluded, keep the occlusion (do not reconstruct hidden parts).
- Place the items neatly on a neutral, light cloth/textured background with soft realistic shadows.
- Keep a square aspect ratio and high quality.

OUTPUT: One square flat lay image including all and only the extracted products.` }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const candidates = (response as any)?.candidates as Array<any> | undefined;
    const outParts = candidates?.[0]?.content?.parts as Array<any> | undefined;
    if (Array.isArray(outParts)) {
      for (const p of outParts) {
        if (p?.inlineData?.data) {
          const base64Image = p.inlineData.data as string;
          const mimeType = p.inlineData.mimeType || 'image/jpeg';
          return res.status(200).json({ base64Image, mimeType });
        }
      }
    }
    throw new Error('No inline image in response');
  } catch (error) {
    console.error('Error generating flat lay:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to generate flat lay.', error: msg });
  } finally {
    // no-op
  }
}

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
    const { garments } = req.body as { garments?: Array<{ base64: string; mimeType: string }> };
    if (!garments || !Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({ message: 'garments array is required' });
    }

    const parts: any[] = [];
    for (const g of garments) {
      if (!g?.base64 || !g?.mimeType) continue;
      parts.push({ inlineData: { data: g.base64, mimeType: g.mimeType } });
    }
    parts.push({ text: `Compose a single overhead flat lay image from the provided garment images. Use a neutral cloth/texture background with soft realistic shadows. Keep aspect ratio 1:1, high quality. Align items neatly without overlaps when possible.` });

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

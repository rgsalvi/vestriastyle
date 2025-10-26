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
    const { person, garments, size } = req.body as { person?: ImageRef; garments?: ImageRef[]; size?: { width: number; height: number } };
    if (!person?.base64 || !person?.mimeType) {
      return res.status(400).json({ message: 'person image is required' });
    }
    if (!garments || !Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({ message: 'garments array is required' });
    }

    // Sequential layering: apply each garment in order onto the current image
    let current: ImageRef = { base64: person.base64, mimeType: person.mimeType };
    for (const [index, g] of garments.entries()) {
      const parts: any[] = [
        { inlineData: { data: current.base64, mimeType: current.mimeType } },
        { inlineData: { data: g.base64, mimeType: g.mimeType } },
        { text: `Replace the clothing on the person using the provided garment image. Ensure realistic fit, drape, and proportions; preserve the person's original background and face exactly. Maintain body pose and lighting; avoid artifacts around edges. This is pass ${index + 1}.` },
      ];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });
      const candidates = (response as any)?.candidates as Array<any> | undefined;
      const outParts = candidates?.[0]?.content?.parts as Array<any> | undefined;
      let next: ImageRef | null = null;
      if (Array.isArray(outParts)) {
        // Prefer a generated image that is not identical to any input image
        const inputs = new Set([current.base64, g.base64]);
        const images = outParts.filter(p => p?.inlineData?.data).map(p => ({ base64: p.inlineData.data as string, mimeType: p.inlineData.mimeType || 'image/jpeg' }));
        // Filter out inputs
        const candidatesOut = images.filter(img => !inputs.has(img.base64));
        next = candidatesOut[candidatesOut.length - 1] || images[images.length - 1] || null;
      }
      if (!next) throw new Error('Missing intermediate image during layering');
      current = next;
    }

    // Return final composite; client can resize/convert to WebP as needed
    return res.status(200).json({ base64Image: current.base64, mimeType: current.mimeType });
  } catch (error) {
    console.error('Error generating try-on:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to generate try-on.', error: msg });
  }
}

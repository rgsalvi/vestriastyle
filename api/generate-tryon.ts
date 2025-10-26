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
    const { person, flatLay, size } = req.body as { person?: ImageRef; flatLay?: ImageRef; size?: { width: number; height: number } };
    if (!person?.base64 || !person?.mimeType) {
      return res.status(400).json({ message: 'person image is required' });
    }
    if (!flatLay?.base64 || !flatLay?.mimeType) {
      return res.status(400).json({ message: 'flatLay image is required' });
    }

    // Single-pass try-on: replace all clothing on the person using the products visible in the flat lay image.
    // Preserve the original face and background exactly; maintain pose and lighting.
    const parts: any[] = [
      { inlineData: { data: person.base64, mimeType: person.mimeType } },
      { inlineData: { data: flatLay.base64, mimeType: flatLay.mimeType } },
      { text: `Using only the products shown in the flat lay image, replace all of the clothing the person is wearing. Ensure realistic fit, drape, and proportions. Preserve the person's original face and background exactly. Maintain body pose and consistent lighting. Avoid artifacts around edges and hands. Output a single high-quality portrait of the person fully dressed in the flat lay outfit.` },
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

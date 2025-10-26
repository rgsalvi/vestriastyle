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
      { text: `Extract all clothing products visible in this image (even if worn by a model). Remove the person/model entirely. Isolate each product with accurate masks and arrange them into a single overhead flat lay on a neutral light cloth/texture background with soft realistic shadows. Avoid brand logos or text overlays. Output one square, high-quality flat lay image that includes every extracted product.` }
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

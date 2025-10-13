import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { base64Image, mimeType, prompt } = req.body;
        if (!base64Image || !mimeType || !prompt) {
            return res.status(400).json({ message: 'Missing required fields: base64Image, mimeType, or prompt' });
        }

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const candidates = (response as any)?.candidates as Array<any> | undefined;
        const parts = candidates?.[0]?.content?.parts as Array<any> | undefined;
        if (Array.isArray(parts)) {
            for (const part of parts) {
                if (part?.inlineData?.data) {
                    return res.status(200).json({ base64Image: part.inlineData.data as string });
                }
            }
        }

        throw new Error("Image generation failed to produce an image part in the response.");
        
    } catch (error) {
        console.error("Error calling Gemini Image Editing API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ message: "Failed to edit outfit image.", error: errorMessage });
    }
}

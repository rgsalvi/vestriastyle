import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

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
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, clean studio photograph of a single clothing item: ${prompt}. Plain white or light gray background, fashion photography style.`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        const images = (response as any)?.generatedImages as Array<any> | undefined;
        if (Array.isArray(images) && images.length > 0 && images[0]?.image?.imageBytes) {
            const base64Image = images[0].image.imageBytes as string;
            return res.status(200).json({ base64Image });
        }
        throw new Error("Image generation failed to produce an image.");
    } catch (error) {
        console.error("Error calling Gemini Image Generation API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ message: "Failed to generate wardrobe image.", error: errorMessage });
    }
}

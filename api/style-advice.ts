import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  // This will cause the function to fail safely if the API key is not set.
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        compatibility: {
            type: Type.STRING,
            description: 'A paragraph explaining how well the new item fits with the existing wardrobe in terms of style, color, and versatility. This advice MUST be tailored to the provided body type.',
        },
        outfits: {
            type: Type.ARRAY,
            description: 'Suggest 2-3 specific, complete outfit combinations using the new item and items from the existing wardrobe that would be flattering for the user\'s body type.',
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'A catchy name for the outfit (e.g., "Casual Weekend Vibes", "Office Chic").',
                    },
                    items: {
                        type: Type.ARRAY,
                        description: 'A list of items that make up this outfit, describing them based on the images.',
                        items: { type: Type.STRING },
                    },
                },
                required: ['title', 'items'],
            },
        },
        advice: {
            type: Type.STRING,
            description: 'Provide one key piece of styling advice or suggest one type of item that might be missing from their wardrobe that would complement the new piece well, keeping the user\'s body type in mind.',
        },
        verdict: {
            type: Type.STRING,
            description: 'A final, one-sentence recommendation. It must be either "Verdict: A great addition, go for it!" or "Verdict: Consider passing on this one."',
        },
    },
    required: ['compatibility', 'outfits', 'advice', 'verdict'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    
    try {
        const { newItem, wardrobeItems, bodyType } = req.body;

        if (!newItem || !wardrobeItems || !bodyType) {
            return res.status(400).json({ message: 'Missing required fields: newItem, wardrobeItems, or bodyType' });
        }

        const model = 'gemini-2.5-flash';
        const prompt = `You are an expert fashion stylist and wardrobe curator. Analyze the user's potential new clothing item in the context of their existing wardrobe.

The user has identified their body type as: **${bodyType}**. Tailor all your advice to be flattering for this body type. For example, for a 'Pear' shape, you might suggest A-line cuts for the new item if it's a skirt, or for an 'Apple' shape, you might suggest empire waists. Your outfit suggestions and compatibility analysis must reflect this personalization.

Based on the provided images (the first image is the new item, the rest are from their existing wardrobe) and the user's body type, provide a detailed analysis.

Your response MUST be a valid JSON object that adheres to the provided schema. Do not include any text, backticks, or markdown formatting before or after the JSON object.`;
        
        const imageParts = [
            { inlineData: { data: newItem.base64, mimeType: newItem.mimeType } },
            ...wardrobeItems.map((item: { base64: string, mimeType: string }) => ({
                inlineData: { data: item.base64, mimeType: item.mimeType }
            }))
        ];

        const contents = [{ parts: [{ text: prompt }, ...imageParts] }];

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
    
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("Error in style-advice API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ message: "Failed to get style advice from AI.", error: errorMessage });
    }
}
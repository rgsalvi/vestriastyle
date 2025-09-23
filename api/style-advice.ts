import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Modality } from "@google/genai";

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
            description: 'Suggest 2-3 specific, complete outfit combinations using the new item and items from the existing wardrobe. Each outfit MUST include specific suggestions for footwear and at least one accessory (e.g., bag, jewelry, scarf). The outfits must be flattering for the user\'s body type.',
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'A catchy name for the outfit (e.g., "Casual Weekend Vibes", "Office Chic").',
                    },
                    items: {
                        type: Type.ARRAY,
                        description: 'A list of items that make up this outfit, describing them based on the images. This list MUST include specific footwear and at least one accessory.',
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
        const { newItem, wardrobeItems, bodyType, styleProfile } = req.body;

        if (!newItem || !wardrobeItems || !bodyType) {
            return res.status(400).json({ message: 'Missing required fields: newItem, wardrobeItems, or bodyType' });
        }
        
        let prompt: string;

        if (styleProfile) {
            const { styleArchetypes, colorPalettes, favoriteBrands } = styleProfile;
            prompt = `You are an expert fashion stylist and wardrobe curator with a deep understanding of body types and personal aesthetics. Analyze the user's potential new clothing item in the context of their existing wardrobe and their detailed style profile.

**User's Style DNA:**
*   **Body Type:** ${bodyType}
*   **Style Archetypes:** ${styleArchetypes.join(', ')}
*   **Preferred Color Palettes:** ${colorPalettes.join(', ')}
*   **Favorite Brands (for style inspiration):** ${favoriteBrands || 'Not specified'}

**Your Task:**
Tailor ALL your advice to be extremely flattering for their **${bodyType}** body shape and perfectly aligned with their specified style archetypes and color preferences. When creating outfit suggestions, you MUST include specific recommendations for both footwear and accessories (like a bag, jewelry, or belt) to create a complete look. Your outfit suggestions, compatibility analysis, and final verdict must reflect this deep level of personalization. Analyze the provided images (the first is the new item, the rest are their wardrobe) and provide a detailed analysis.

Your response MUST be a valid JSON object that adheres to the provided schema. Do not include any text, backticks, or markdown formatting before or after the JSON object.`;
        } else {
             prompt = `You are an expert fashion stylist and wardrobe curator with a deep understanding of body types. Analyze the user's potential new clothing item in the context of their existing wardrobe.

**User's Profile:**
*   **Body Type:** ${bodyType}

**Your Task:**
Tailor ALL your advice to be extremely flattering for their **${bodyType}** body shape. When creating outfit suggestions, you MUST include specific recommendations for both footwear and accessories (like a bag, jewelry, or belt) to create a complete look. Your outfit suggestions, compatibility analysis, and final verdict must focus on this. Analyze the provided images (the first is the new item, the rest are their wardrobe) and provide a detailed analysis.

Your response MUST be a valid JSON object that adheres to the provided schema. Do not include any text, backticks, or markdown formatting before or after the JSON object.`;
        }

        const model = 'gemini-2.5-flash';
        
        const imageParts = [
            { inlineData: { data: newItem.base64, mimeType: newItem.mimeType } },
            ...wardrobeItems.map((item: { base64: string, mimeType: string }) => ({
                inlineData: { data: item.base64, mimeType: item.mimeType }
            }))
        ];

        const contents = [{ parts: [{ text: prompt }, ...imageParts] }];

        const textResponse = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
    
        const jsonText = textResponse.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson.outfits && parsedJson.outfits.length > 0) {
            const imagePromises = parsedJson.outfits.map(async (outfit: { items: string[] }) => {
                try {
                    const outfitDescription = outfit.items.join(', ');
                    const imageGenPrompt = `Create a photorealistic visualization of a complete outfit. The main clothing item is provided in the image. The rest of the outfit is described as: "${outfitDescription}". The outfit should be styled to be flattering for a '${bodyType}' body shape. Display the full outfit on a mannequin or as a professional flat-lay photograph. The style should be clean and minimalist, with a plain light-colored background, like a studio fashion shoot.`;

                    const imageResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image-preview',
                        contents: {
                            parts: [
                                { inlineData: { data: newItem.base64, mimeType: newItem.mimeType } },
                                { text: imageGenPrompt },
                            ],
                        },
                        config: {
                            responseModalities: [Modality.IMAGE, Modality.TEXT],
                        },
                    });
                    
                    for (const part of imageResponse.candidates[0].content.parts) {
                        if (part.inlineData) {
                            return part.inlineData.data;
                        }
                    }
                    return null;
                } catch (imageError) {
                    console.error("Error generating an outfit image:", imageError);
                    return null; 
                }
            });

            const generatedImages = (await Promise.all(imagePromises)).filter(img => img !== null) as string[];
            parsedJson.generatedOutfitImages = generatedImages;
        }

        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("Error in style-advice API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ message: "Failed to get style advice from AI.", error: errorMessage });
    }
}
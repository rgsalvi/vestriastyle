import { GoogleGenAI, Type } from "@google/genai";
import type { WardrobeItem, AiResponse, BodyType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

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

export const getStyleAdvice = async (newItem: WardrobeItem, wardrobeItems: WardrobeItem[], bodyType: BodyType): Promise<AiResponse> => {
  const model = 'gemini-2.5-flash';

  const prompt = `You are an expert fashion stylist and wardrobe curator. Analyze the user's potential new clothing item in the context of their existing wardrobe.

The user has identified their body type as: **${bodyType}**. Tailor all your advice to be flattering for this body type. For example, for a 'Pear' shape, you might suggest A-line cuts for the new item if it's a skirt, or for an 'Apple' shape, you might suggest empire waists. Your outfit suggestions and compatibility analysis must reflect this personalization.

Based on the provided images (the first image is the new item, the rest are from their existing wardrobe) and the user's body type, provide a detailed analysis.

Your response MUST be a valid JSON object that adheres to the provided schema. Do not include any text, backticks, or markdown formatting before or after the JSON object.`;

  try {
    const imageParts = await Promise.all([
        fileToGenerativePart(newItem.file),
        ...wardrobeItems.map(item => fileToGenerativePart(item.file))
    ]);
    
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
    return JSON.parse(jsonText) as AiResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get style advice from AI. The model may be unable to process the request.");
  }
};

export const generateWardrobeImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A professional, clean studio photograph of a single clothing item: ${prompt}. Plain white or light gray background, fashion photography style.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    } else {
        throw new Error("Image generation failed to produce an image.");
    }
  } catch (error) {
    console.error("Error calling Gemini Image Generation API:", error);
    throw new Error("Failed to generate wardrobe image.");
  }
};
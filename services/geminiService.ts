import type { AnalysisItem, AiResponse, BodyType } from '../types';

export const getStyleAdvice = async (newItem: AnalysisItem, wardrobeItems: AnalysisItem[], bodyType: BodyType): Promise<AiResponse> => {
  try {
    const newItemPayload = {
      base64: newItem.base64,
      mimeType: newItem.mimeType,
    };
    const wardrobeItemsPayload = wardrobeItems.map(item => ({
      base64: item.base64,
      mimeType: item.mimeType,
    }));
    
    const response = await fetch('/api/style-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newItem: newItemPayload,
        wardrobeItems: wardrobeItemsPayload,
        bodyType: bodyType,
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server responded with an error');
    }

    return await response.json() as AiResponse;

  } catch (error) {
    console.error("Error fetching style advice:", error);
    throw new Error("Failed to get style advice. Please check your connection and try again.");
  }
};

export const generateWardrobeImage = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server responded with an error');
    }

    const data = await response.json();
    if (!data.base64Image) {
      throw new Error("API did not return an image.");
    }
    return data.base64Image;

  } catch (error) {
    console.error("Error generating wardrobe image:", error);
    throw new Error("Failed to generate wardrobe image.");
  }
};
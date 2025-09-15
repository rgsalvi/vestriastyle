import type { WardrobeItem, AiResponse, BodyType } from '../types';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const getStyleAdvice = async (newItem: WardrobeItem, wardrobeItems: WardrobeItem[], bodyType: BodyType): Promise<AiResponse> => {
  try {
    const newItemPayload = {
      base64: await fileToBase64(newItem.file),
      mimeType: newItem.file.type,
    };
    const wardrobeItemsPayload = await Promise.all(
      wardrobeItems.map(async item => ({
        base64: await fileToBase64(item.file),
        mimeType: item.file.type,
      }))
    );
    
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
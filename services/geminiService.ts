import type { AnalysisItem, AiResponse, StyleProfile, BodyType, Occasion, User } from '../types';

export const getStyleAdvice = async (newItem: AnalysisItem, wardrobeItems: AnalysisItem[], bodyType: BodyType, occasion: Occasion, styleProfile: StyleProfile | null): Promise<AiResponse> => {
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
        occasion: occasion,
        styleProfile: styleProfile,
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

export const editOutfitImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/edit-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Image, mimeType, prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server responded with an error');
        }

        const data = await response.json();
        if (!data.base64Image) {
            throw new Error("API did not return an edited image.");
        }
        return data.base64Image;

    } catch (error) {
        console.error("Error editing outfit image:", error);
        throw new Error("Failed to edit outfit image.");
    }
};

export interface ChatSessionData {
    success: boolean;
    message: string;
    token: string;
    conversationSid: string;
    stylist: {
        name: string;
        title: string;
        avatarUrl: string;
    };
}

export const initiateChatSession = async (analysisContext: AiResponse, user: User, newItem: AnalysisItem | null): Promise<ChatSessionData> => {
    try {
        const response = await fetch('/api/initiate-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysisContext, user, newItem }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server responded with an error');
        }

        return await response.json() as ChatSessionData;
    } catch (error) {
        console.error("Error initiating chat session:", error);
        throw new Error("Could not connect to the stylist service. Please try again later.");
    }
};
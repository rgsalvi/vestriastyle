import type { AnalysisItem, AiResponse, StyleProfile, BodyType, Occasion, User } from '../types';

export const getStyleAdvice = async (newItem: AnalysisItem, wardrobeItems: AnalysisItem[], bodyType: BodyType, occasion: Occasion, styleProfile: StyleProfile | null): Promise<AiResponse> => {
  const controller = new AbortController();
  const timeoutMs = 45000; // hard cap to avoid indefinite UI spinner
  const startedAt = Date.now();
  const timeout = setTimeout(() => {
    try { controller.abort(); } catch {}
  }, timeoutMs);
  console.log('[style-advice] start', { bodyType, occasion, wardrobeCount: wardrobeItems.length });
  try {
    const newItemPayload = { base64: newItem.base64, mimeType: newItem.mimeType };
    const wardrobeItemsPayload = wardrobeItems.map(item => ({ base64: item.base64, mimeType: item.mimeType }));

    const response = await fetch('/api/style-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newItem: newItemPayload, wardrobeItems: wardrobeItemsPayload, bodyType, occasion, styleProfile }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail: any = null;
      try { errorDetail = await response.json(); } catch {}
      throw new Error(errorDetail?.message || 'Server responded with an error');
    }
    const data = await response.json() as AiResponse;
    console.log('[style-advice] success', { durationMs: Date.now() - startedAt });
    return data;
  } catch (error) {
    const aborted = (error as any)?.name === 'AbortError';
    console.error('[style-advice] failure', { aborted, durationMs: Date.now() - startedAt, error });
    // Fallback lightweight response so UI does not stay in perpetual loading state.
    const fallback: AiResponse = {
      compatibility: 'We had a temporary issue generating the full analysis. Here is a quick heuristic note: focus on balanced proportions and cohesive color pairing with this item.',
      outfits: [
        { title: 'Foundational Pairing', items: ['New item', 'Neutral coordinating piece', 'Simple footwear', 'One subtle accessory'] },
        { title: 'Elevated Variation', items: ['New item', 'Contrast layer', 'Clean shoes', 'Refined accent accessory'] },
      ],
      advice: 'Retry in a bit for fully personalized, detailed styling. This fallback ensures you are not left waiting.',
      verdict: 'Verdict: Consider passing on this one.'
    };
    return fallback;
  } finally {
    clearTimeout(timeout);
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
    id: string;
        name: string;
        title: string;
        avatarUrl: string;
        bio?: string;
    signatureAesthetic?: string;
    highlights?: string[];
    socials?: { [key: string]: string };
    };
    initialImages?: {
    newItem?: { base64: string; mimeType: string };
    outfits?: string[];
    };
}


// Lightweight analytics event sender (best-effort, fire-and-forget)
export async function trackEvent(type: string, meta?: any) {
  try {
    let idToken: string | undefined;
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      idToken = await auth.currentUser?.getIdToken();
    } catch {}
    await fetch('/api/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ type, meta }),
      keepalive: true,
    });
  } catch (e) {
    // swallow
  }
}

export const initiateChatSession = async (analysisContext: AiResponse, newItemContext: AnalysisItem | null, user: User, isPremium: boolean): Promise<ChatSessionData> => {
    try {
        let idToken: string | undefined = undefined;
        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          idToken = await auth.currentUser?.getIdToken();
        } catch {}
        const response = await fetch('/api/initiate-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
            },
      body: JSON.stringify({ analysisContext, newItemContext, user: { ...user, isPremium } }),
        });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        // Preserve structured error codes for caller logic
        const code = errorData.error;
        const msg = errorData.message || 'Server responded with an error';
        const err = new Error(code ? `${msg}: ${code}` : msg) as any;
        if (code) err.code = code;
        if (code === 'ONBOARDING_INCOMPLETE') {
          trackEvent('chat_denied_onboarding_incomplete');
        }
        throw err;
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error('Server responded with an error');
      }
    }

    return await response.json() as ChatSessionData;
  } catch (error: any) {
    console.error("Error initiating chat session:", error);
    throw error;
  }
};
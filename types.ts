export type BodyType = 'Apple' | 'Pear' | 'Rectangle' | 'Inverted Triangle' | 'Hourglass' | 'None';
export type Occasion = 'Everyday' | 'Casual' | 'Work' | 'Date Night' | 'Weekend' | 'Special Event' | 'None';

export interface WardrobeItem {
  file: File;
  preview: string;
}

export interface AnalysisItem {
  preview: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export interface PersistentWardrobeItem {
  id: string;
  dataUrl: string;
  description: string;
  category: string;
  color: string;
  fabric: string;
  season: string;
}

export interface Outfit {
  title: string;
  items: string[];
}

export interface AiResponse {
  compatibility: string;
  outfits: Outfit[];
  advice: string;
  verdict: string;
  generatedOutfitImages?: string[];
}

export interface StyleRecipe {
  title: string;
  description: string;
  items: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface StyleProfile {
  styleArchetypes: string[];
  colorPalettes: string[];
  favoriteColors?: string;
  favoriteBrands: string;
  bodyType: BodyType;
  avatar_url?: string; // Supabase storage path
  isPremium?: boolean;
  onboardingComplete?: boolean; // Phase 1 flag added to mark explicit completion of onboarding
  isOnboarded?: boolean; // New explicit flag; true only after Finish successfully persists profile
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'stylist' | 'system';
  text: string;
  timestamp: string;
  imageUrl?: string;
  videoUrl?: string;
}
export type BodyType = 'Apple' | 'Pear' | 'Rectangle' | 'Inverted Triangle' | 'Hourglass' | 'None';

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
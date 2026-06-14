// Firestore data model and TypeScript interfaces for Vestria Style
// This file defines the structure of all Firestore collections

import type { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Users Collection: /users/{uid}
// ============================================================================
export interface FirestoreUser {
  id: string; // Firebase UID
  email: string; // Unique, NOT NULL
  display_name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string; // ISO format (YYYY-MM-DD)
  avatar_url?: string; // Firebase Storage path (users/{uid}/avatar.{ext})

  // Style profile fields
  style_archetypes: string[]; // e.g., ['Minimalist', 'Classic']
  color_palettes: string[]; // e.g., ['Earthy Neutrals', 'Monochrome']
  favorite_colors?: string;
  favorite_brands?: string;
  body_type?: string; // 'Apple', 'Pear', 'Rectangle', 'Hourglass', etc.

  // Onboarding & premium status
  is_onboarded: boolean;
  is_premium: boolean;

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
  _metadata?: {
    last_sync?: Timestamp;
    migration_from?: 'supabase' | 'firebase_legacy'; // For audit trail
  };
}

// ============================================================================
// Wardrobe Items Collection: /wardrobe/{uid}/items/{itemId}
// ============================================================================
export interface FirestoreWardrobeItem {
  id: string; // UUID
  user_id: string; // Redundant for RLS enforcement
  category?: string; // e.g., 'Top', 'Bottom', 'Dress', 'Outerwear'
  color?: string;
  image_url?: string; // Base64 data URL or Firebase Storage path
  notes?: string;

  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Recipes Collection: /recipes/{slug}
// ============================================================================
export interface FirestoreRecipe {
  id: string;
  slug: string; // Unique URL-friendly identifier (e.g., "2025-09-26-date-night")
  date: string; // ISO format (YYYY-MM-DD), indexed for sorting
  title: string;
  founder_id: 'tanvi' | 'muskaan' | 'riddhi';
  description: Array<{
    lead: string;
    body: string;
  }>;

  // Image paths in Firebase Storage
  flatlay_url?: string; // /recipes/{slug}/flatlay.webp
  model_url?: string; // /recipes/{slug}/model.webp
  flatlay_alt?: string; // Alt text for accessibility
  model_alt?: string;

  created_by?: string; // Email of creator
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Analytics Collection: /analytics/{dateKey}/events/{eventId}
// ============================================================================
export interface FirestoreAnalyticsEvent {
  type: string; // e.g., 'signup_start', 'onboarding_complete', 'chat_denied_onboarding_incomplete'
  uid?: string; // User ID (optional for anonymous events)
  meta?: Record<string, any>; // Event-specific data (e.g., { email: 'user@example.com' })
  user_agent?: string;
  created_at: Timestamp;
}

// ============================================================================
// Premium Collection: /premium/{uid}
// ============================================================================
export interface FirestorePremium {
  is_premium: boolean;
  upgraded_at?: Timestamp;
  tier?: 'standard' | 'pro'; // For future use
  expires_at?: Timestamp; // If premium is time-limited
}

// ============================================================================
// Type Helpers
// ============================================================================

export type UserProfile = Omit<FirestoreUser, 'id'>;
export type WardrobeItem = Omit<FirestoreWardrobeItem, 'user_id'>;

// Partial update types (used when saving incomplete data)
export type UserProfileUpdate = Partial<Omit<FirestoreUser, 'id' | 'created_at' | 'updated_at'>>;
export type WardrobeItemUpdate = Partial<Omit<FirestoreWardrobeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

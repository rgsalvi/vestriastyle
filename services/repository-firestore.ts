import { ref, set, get, remove } from 'firebase/database';
import type { StyleProfile, PersistentWardrobeItem } from '../types';
import { db } from './firebase';

// User identity type for Realtime DB
interface RealtimeDBUser {
  uid: string;
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  avatar_url?: string;
  style_archetypes?: string[];
  color_palettes?: string[];
  favorite_colors?: string;
  favorite_brands?: string;
  body_type?: string;
  is_onboarded?: boolean;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Ensure user document exists in Realtime Database
export async function repositoryEnsureUserRow(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        uid,
        email: email || `${uid}@placeholder.local`,
        display_name: displayName || email || `${uid}@placeholder.local`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('[realtime-db] ensureUserRow created successfully');
    }
  } catch (e) {
    console.error('[realtime-db] ensureUserRow failed', e);
    throw e;
  }
}

// Load user profile from Realtime Database
export async function repositoryLoadUserProfile(uid: string): Promise<StyleProfile | null> {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val() as Partial<RealtimeDBUser>;
    return mapRealtimeDBToStyleProfile(data);
  } catch (e) {
    console.error('[realtime-db] loadUserProfile failed', e);
    throw e;
  }
}

// Save user profile to Realtime Database
export async function repositorySaveUserProfile(
  uid: string,
  profile: Partial<StyleProfile>
): Promise<void> {
  try {
    const userRef = ref(db, `users/${uid}`);

    // Read current data to preserve existing fields
    const snapshot = await get(userRef);
    const existing = snapshot.val() || {};

    const payload: any = {
      ...existing,
      style_archetypes: profile.styleArchetypes ?? existing.style_archetypes,
      color_palettes: profile.colorPalettes ?? existing.color_palettes,
      favorite_colors: profile.favoriteColors ?? existing.favorite_colors,
      favorite_brands: profile.favoriteBrands ?? existing.favorite_brands,
      body_type: profile.bodyType ?? existing.body_type,
      avatar_url: profile.avatar_url ?? existing.avatar_url,
      is_premium: profile.isPremium ?? existing.is_premium,
      is_onboarded: profile.isOnboarded ?? existing.is_onboarded,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined keys
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    await set(userRef, payload);
    console.log('[realtime-db] saveUserProfile completed');
  } catch (e) {
    console.error('[realtime-db] saveUserProfile failed', e);
    throw e;
  }
}

// List wardrobe items
export async function repositoryListWardrobe(uid: string): Promise<PersistentWardrobeItem[]> {
  try {
    const wardrobeRef = ref(db, `wardrobe/${uid}`);
    const snapshot = await get(wardrobeRef);

    if (!snapshot.exists()) {
      return [];
    }

    const items = snapshot.val() as Record<string, any>;
    return Object.entries(items).map(([id, data]) => ({ id, ...data } as any));
  } catch (e) {
    console.error('[realtime-db] listWardrobe failed', e);
    throw e;
  }
}

// Save wardrobe items
export async function repositorySaveWardrobeItems(
  uid: string,
  items: PersistentWardrobeItem[]
): Promise<void> {
  if (!items.length) return;

  try {
    for (const item of items) {
      const itemRef = ref(db, `wardrobe/${uid}/${item.id || 'temp'}`);
      await set(itemRef, {
        ...item,
        updated_at: new Date().toISOString(),
      });
    }
    console.log('[realtime-db] saveWardrobeItems completed');
  } catch (e) {
    console.error('[realtime-db] saveWardrobeItems failed', e);
    throw e;
  }
}

// Upload avatar via API
export async function repositoryUploadAvatar(uid: string, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) throw new Error('Unsupported avatar format');

  try {
    const mod = await import('./firebase');
    const auth = (mod as any).auth;
    const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : undefined;

    const resp = await fetch('/api/upload-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ dataUrl }),
    });

    if (!resp.ok) {
      const t = await resp.json().catch(() => ({} as any));
      const msg = t?.message || `Upload failed (${resp.status})`;
      throw new Error(msg);
    }

    const json = await resp.json();
    return json.path as string;
  } catch (e) {
    console.error('[realtime-db] uploadAvatar failed', e);
    throw e;
  }
}

// Delete all user data
export async function repositoryDeleteAllUserData(uid: string): Promise<void> {
  try {
    const userRef = ref(db, `users/${uid}`);
    const wardrobeRef = ref(db, `wardrobe/${uid}`);

    await remove(userRef);
    await remove(wardrobeRef);
    console.log('[realtime-db] deleteAllUserData completed');
  } catch (e) {
    console.error('[realtime-db] deleteAllUserData failed', e);
    throw e;
  }
}

// Load user identity
export async function repositoryLoadUserIdentity(
  uid: string
): Promise<{ display_name: string | null; date_of_birth: string | null; first_name?: string | null; last_name?: string | null }> {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return { display_name: null, date_of_birth: null };
    }

    const data = snapshot.val() as Partial<RealtimeDBUser>;
    return {
      display_name: data.display_name ?? null,
      date_of_birth: data.date_of_birth ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
    };
  } catch (e) {
    console.error('[realtime-db] loadUserIdentity failed', e);
    throw e;
  }
}

// Update user identity via API
export async function repositoryUpdateIdentity(args: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}): Promise<void> {
  try {
    const mod = await import('./firebase');
    const auth = (mod as any).auth;
    const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : undefined;

    const resp = await fetch('/api/update-identity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify(args),
    });

    if (!resp.ok) {
      const t = await resp.json().catch(() => ({} as any));
      throw new Error(t?.message || `Failed to update identity (${resp.status})`);
    }
  } catch (e) {
    console.error('[realtime-db] updateIdentity failed', e);
    throw e;
  }
}

// Find user by email
export async function repositoryFindUserByEmail(
  email: string
): Promise<{ display_name: string | null; first_name: string | null } | null> {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      console.log('[realtime-db] findUserByEmail: no users collection');
      return null;
    }

    const users = snapshot.val() as Record<string, RealtimeDBUser>;
    console.log('[realtime-db] findUserByEmail: checking', Object.keys(users).length, 'users for email:', email);

    const found = Object.values(users).find(u => {
      const matches = u.email?.toLowerCase() === email.toLowerCase();
      if (matches) {
        console.log('[realtime-db] findUserByEmail: found match', u.email);
      }
      return matches;
    });

    if (!found) {
      console.log('[realtime-db] findUserByEmail: no match found');
      return null;
    }

    return {
      display_name: found.display_name ?? null,
      first_name: found.first_name ?? null,
    };
  } catch (e) {
    console.error('[realtime-db] findUserByEmail failed', e);
    return null;
  }
}

// Get public URL for Firebase Storage avatar
export function getFirebaseStorageAvatarPublicUrl(path: string): string {
  if (!path) return `https://ui-avatars.com/api/?name=User`;

  // If already a URL, return as-is
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  // For Firebase Storage, construct public URL
  const projectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'vestria-style';
  return `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodeURIComponent(path)}?alt=media`;
}

// Helper: Map Realtime DB user to StyleProfile
function mapRealtimeDBToStyleProfile(doc: Partial<RealtimeDBUser>): StyleProfile {
  return {
    styleArchetypes: doc.style_archetypes ?? [],
    colorPalettes: doc.color_palettes ?? [],
    favoriteColors: doc.favorite_colors ?? '',
    favoriteBrands: doc.favorite_brands ?? '',
    bodyType: (doc.body_type ?? 'None') as any,
    avatar_url: doc.avatar_url,
    isPremium: doc.is_premium ?? false,
    isOnboarded: doc.is_onboarded ?? false,
  };
}

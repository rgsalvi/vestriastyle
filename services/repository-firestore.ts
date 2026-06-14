import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc, deleteField, writeBatch, serverTimestamp, Query } from 'firebase/firestore';
import type { StyleProfile, PersistentWardrobeItem } from '../types';
import type {
  FirestoreUser,
  FirestoreWardrobeItem,
  UserProfileUpdate,
} from '../firestore-schema';

const db = getFirestore();

// Helper: Convert Firestore timestamp to JS Date or ISO string
function toISOString(ts: any): string | undefined {
  if (!ts) return undefined;
  return ts.toDate?.().toISOString() ?? undefined;
}

// ============================================================================
// CORE OPERATIONS
// ============================================================================

/**
 * Ensure a user document exists in Firestore.
 * This is CRITICAL to prevent race conditions during onboarding.
 * Must be called BEFORE attempting to save profile data.
 */
export async function repositoryEnsureUserRow(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);

  try {
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      return; // User already exists, do nothing
    }

    // Create new user document with required fields
    await setDoc(userRef, {
      id: uid,
      email: email || `${uid}@placeholder.local`,
      display_name: displayName || email || `${uid}@placeholder.local`,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (e) {
    console.error('[firestore-repo] ensureUserRow failed', e);
    throw e;
  }
}

/**
 * Load a user's profile from Firestore
 */
export async function repositoryLoadUserProfile(uid: string): Promise<StyleProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return null;
    }

    return mapFirestoreToStyleProfile(docSnap.data() as Partial<FirestoreUser>);
  } catch (e) {
    console.error('[firestore-repo] loadUserProfile failed', e);
    throw e;
  }
}

/**
 * Save a user's profile to Firestore
 */
export async function repositorySaveUserProfile(
  uid: string,
  profile: Partial<StyleProfile>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const payload: any = {
      style_archetypes: profile.styleArchetypes,
      color_palettes: profile.colorPalettes,
      favorite_colors: profile.favoriteColors,
      favorite_brands: profile.favoriteBrands,
      body_type: profile.bodyType,
      avatar_url: profile.avatar_url,
      is_premium: profile.isPremium,
      is_onboarded: profile.isOnboarded,
      updated_at: serverTimestamp(),
    };

    // Remove undefined keys
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    await setDoc(userRef, payload, { merge: true });
  } catch (e) {
    console.error('[firestore-repo] saveUserProfile failed', e);
    throw e;
  }
}

/**
 * Load user's wardrobe items
 */
export async function repositoryListWardrobe(uid: string): Promise<PersistentWardrobeItem[]> {
  try {
    const itemsRef = collection(db, 'users', uid, 'items');
    const q = query(itemsRef);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (e) {
    console.error('[firestore-repo] listWardrobe failed', e);
    throw e;
  }
}

/**
 * Save wardrobe items
 */
export async function repositorySaveWardrobeItems(
  uid: string,
  items: PersistentWardrobeItem[]
): Promise<void> {
  if (!items.length) return;

  try {
    const batch = writeBatch(db);

    for (const item of items) {
      const itemRef = doc(db, 'users', uid, 'items', item.id || 'temp');
      batch.set(itemRef, {
        ...item,
        updated_at: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (e) {
    console.error('[firestore-repo] saveWardrobeItems failed', e);
    throw e;
  }
}

/**
 * Upload avatar via API
 */
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
    console.error('[firestore-repo] uploadAvatar failed', e);
    throw e;
  }
}

/**
 * Delete all user data
 */
export async function repositoryDeleteAllUserData(uid: string): Promise<void> {
  try {
    // Delete wardrobe items
    const itemsRef = collection(db, 'users', uid, 'items');
    const itemsSnap = await getDocs(itemsRef);
    const batch = writeBatch(db);

    itemsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user document
    const userRef = doc(db, 'users', uid);
    batch.delete(userRef);

    await batch.commit();
  } catch (e) {
    console.error('[firestore-repo] deleteAllUserData failed', e);
    throw e;
  }
}

/**
 * Load user identity fields
 */
export async function repositoryLoadUserIdentity(
  uid: string
): Promise<{ display_name: string | null; date_of_birth: string | null; first_name?: string | null; last_name?: string | null }> {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return { display_name: null, date_of_birth: null };
    }

    const data = docSnap.data() as Partial<FirestoreUser>;
    return {
      display_name: data.display_name ?? null,
      date_of_birth: data.date_of_birth ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
    };
  } catch (e) {
    console.error('[firestore-repo] loadUserIdentity failed', e);
    throw e;
  }
}

/**
 * Update user identity via API
 */
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
    console.error('[firestore-repo] updateIdentity failed', e);
    throw e;
  }
}

/**
 * Find user by email
 */
export async function repositoryFindUserByEmail(
  email: string
): Promise<{ display_name: string | null; first_name: string | null } | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    const data = snap.docs[0].data() as Partial<FirestoreUser>;
    return {
      display_name: data.display_name ?? null,
      first_name: data.first_name ?? null,
    };
  } catch (e) {
    console.error('[firestore-repo] findUserByEmail failed', e);
    return null;
  }
}

/**
 * Get public URL for Firebase Storage avatar
 */
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

// ============================================================================
// HELPER FUNCTIONS - Data Mapping
// ============================================================================

function mapFirestoreToStyleProfile(doc: Partial<FirestoreUser>): StyleProfile {
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

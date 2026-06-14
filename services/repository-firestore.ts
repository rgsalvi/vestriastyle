import * as admin from 'firebase-admin';
import type { StyleProfile, PersistentWardrobeItem } from '../types';
import type {
  FirestoreUser,
  FirestoreWardrobeItem,
  UserProfileUpdate,
} from '../firestore-schema';

// Get Firestore admin instance
function getFirestoreAdmin() {
  try {
    return admin.firestore();
  } catch (e) {
    console.error('[firestore-repo] Failed to get Firestore admin instance', e);
    throw e;
  }
}

// Helper: Convert Firestore timestamp to JS Date or ISO string
function toISOString(ts: admin.firestore.Timestamp | undefined): string | undefined {
  if (!ts) return undefined;
  return ts.toDate().toISOString();
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
  const db = getFirestoreAdmin();
  const userRef = db.collection('users').doc(uid);

  try {
    const existing = await userRef.get();
    if (existing.exists) {
      return; // User already exists, do nothing
    }

    // Create new user document with required fields
    await userRef.set(
      {
        id: uid,
        email: email || `${uid}@placeholder.local`,
        display_name: displayName || email || 'User',
        style_archetypes: [],
        color_palettes: [],
        is_onboarded: false,
        is_premium: false,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false }
    );

    console.log(`[firestore-repo] Created user document for ${uid}`);
  } catch (error) {
    console.error(`[firestore-repo] ensureUserRow failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Load user profile from Firestore
 */
export async function repositoryLoadUserProfile(uid: string): Promise<StyleProfile | null> {
  const db = getFirestoreAdmin();

  try {
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      console.log(`[firestore-repo] User ${uid} not found`);
      return null;
    }

    const data = doc.data() as FirestoreUser;
    return mapFirestoreToStyleProfile(data);
  } catch (error) {
    console.error(`[firestore-repo] loadUserProfile failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Save user profile to Firestore with retry logic for transient failures
 */
export async function repositorySaveUserProfile(
  uid: string,
  profile: Partial<StyleProfile>,
  retryCount = 0
): Promise<void> {
  const maxRetries = 3;
  const baseDelay = 500; // ms

  try {
    // CRITICAL: Ensure user row exists first
    if (!profile.email && !profile.display_name) {
      // If no email/display_name provided, ensure basic user row exists
      const existing = await getFirestoreAdmin().collection('users').doc(uid).get();
      if (!existing.exists) {
        console.warn(
          '[firestore-repo] User row missing for profile save, creating now'
        );
        await repositoryEnsureUserRow(uid, '', '');
      }
    }

    const db = getFirestoreAdmin();
    const userRef = db.collection('users').doc(uid);
    const payload = mapStyleProfileToFirestore(profile);

    // Remove undefined keys to avoid nulling out existing data
    Object.keys(payload).forEach((key) => {
      if ((payload as any)[key] === undefined) {
        delete (payload as any)[key];
      }
    });

    // Add server timestamp
    (payload as any).updated_at = admin.firestore.FieldValue.serverTimestamp();

    await userRef.set(payload, { merge: true });

    console.log(`[firestore-repo] Saved profile for ${uid}`);
  } catch (error: any) {
    // Retry on specific errors (transient network issues, etc.)
    const isRetryable =
      retryCount < maxRetries &&
      (error.code === 'DEADLINE_EXCEEDED' ||
        error.code === 'INTERNAL' ||
        error.code === 'UNAVAILABLE' ||
        error.message?.includes('PERMISSION_DENIED') // Sometimes transient
      );

    if (isRetryable) {
      const delayMs = baseDelay * Math.pow(2, retryCount);
      console.warn(
        `[firestore-repo] saveUserProfile retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`,
        error.code
      );
      await new Promise((r) => setTimeout(r, delayMs));
      return repositorySaveUserProfile(uid, profile, retryCount + 1);
    }

    console.error(`[firestore-repo] saveUserProfile failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Load user identity (first_name, last_name, date_of_birth)
 */
export async function repositoryLoadUserIdentity(
  uid: string
): Promise<{
  display_name: string | null;
  date_of_birth: string | null;
  first_name?: string | null;
  last_name?: string | null;
}> {
  const db = getFirestoreAdmin();

  try {
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      return { display_name: null, date_of_birth: null };
    }

    const data = doc.data() as Partial<FirestoreUser>;

    return {
      display_name: data.display_name ?? null,
      date_of_birth: data.date_of_birth ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
    };
  } catch (error) {
    console.error(`[firestore-repo] loadUserIdentity failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Update user identity fields (first_name, last_name, date_of_birth)
 */
export async function repositoryUpdateIdentity(args: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  uid?: string; // Required for server-side calls
}): Promise<void> {
  const uid = args.uid;
  if (!uid) {
    throw new Error('uid is required for repositoryUpdateIdentity');
  }

  const db = getFirestoreAdmin();
  const userRef = db.collection('users').doc(uid);

  try {
    const payload: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (args.firstName !== undefined) payload.first_name = args.firstName || null;
    if (args.lastName !== undefined) payload.last_name = args.lastName || null;
    if (args.dateOfBirth !== undefined)
      payload.date_of_birth = args.dateOfBirth || null;

    await userRef.set(payload, { merge: true });

    console.log(`[firestore-repo] Updated identity for ${uid}`);
  } catch (error) {
    console.error(`[firestore-repo] updateIdentity failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * List all wardrobe items for a user
 */
export async function repositoryListWardrobe(uid: string): Promise<PersistentWardrobeItem[]> {
  const db = getFirestoreAdmin();

  try {
    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('items')
      .orderBy('created_at', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreWardrobeItem;
      return {
        id: data.id,
        category: data.category,
        color: data.color,
        image_url: data.image_url,
        notes: data.notes,
      };
    });
  } catch (error) {
    console.error(`[firestore-repo] listWardrobe failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Save/upsert wardrobe items (batch operation)
 */
export async function repositorySaveWardrobeItems(
  uid: string,
  items: PersistentWardrobeItem[]
): Promise<void> {
  if (!items.length) return;

  const db = getFirestoreAdmin();
  const batch = db.batch();
  const userWardrobeRef = db.collection('users').doc(uid).collection('items');

  try {
    for (const item of items) {
      const docRef = userWardrobeRef.doc(item.id);
      const payload = {
        id: item.id,
        user_id: uid,
        category: item.category,
        color: item.color,
        image_url: item.image_url,
        notes: item.notes,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Set created_at only on first write
      const existing = await docRef.get();
      if (!existing.exists) {
        (payload as any).created_at = admin.firestore.FieldValue.serverTimestamp();
      }

      batch.set(docRef, payload, { merge: true });
    }

    await batch.commit();
    console.log(`[firestore-repo] Saved ${items.length} wardrobe items for ${uid}`);
  } catch (error) {
    console.error(`[firestore-repo] saveWardrobeItems failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Delete all user data (called during account deletion)
 */
export async function repositoryDeleteAllUserData(uid: string): Promise<void> {
  const db = getFirestoreAdmin();

  try {
    // Delete all wardrobe items
    const itemsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('items')
      .get();

    const itemsBatch = db.batch();
    itemsSnapshot.docs.forEach((doc) => {
      itemsBatch.delete(doc.ref);
    });
    await itemsBatch.commit();

    // Delete user document
    await db.collection('users').doc(uid).delete();

    // Delete premium document if exists
    try {
      await db.collection('premium').doc(uid).delete();
    } catch {
      // Ignore if doesn't exist
    }

    console.log(`[firestore-repo] Deleted all data for ${uid}`);
  } catch (error) {
    console.error(`[firestore-repo] deleteAllUserData failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Find user by email
 */
export async function repositoryFindUserByEmail(
  email: string
): Promise<{ display_name: string | null; first_name: string | null } | null> {
  const db = getFirestoreAdmin();

  try {
    const snapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data() as Partial<FirestoreUser>;

    return {
      display_name: data.display_name ?? null,
      first_name: data.first_name ?? null,
    };
  } catch (error) {
    console.error(`[firestore-repo] findUserByEmail failed for ${email}:`, error);
    return null; // Return null instead of throwing to match Supabase behavior
  }
}

/**
 * Upload avatar to Firebase Storage
 */
export async function repositoryUploadAvatar(uid: string, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Avatar must be a data URL');
  }

  try {
    const bucket = admin.storage().bucket();

    // Parse data URL: data:image/png;base64,iVBORw0KG...
    const matches = dataUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }

    const [, ext, base64Data] = matches;
    const buffer = Buffer.from(base64Data, 'base64');

    // Check size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new Error(`Avatar too large (max ${maxSizeBytes / 1024 / 1024}MB)`);
    }

    const filePath = `avatars/${uid}/avatar.${ext}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: `image/${ext}`,
      },
      public: true,
    });

    console.log(`[firestore-repo] Uploaded avatar to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`[firestore-repo] uploadAvatar failed for ${uid}:`, error);
    throw error;
  }
}

/**
 * Get public URL for avatar stored in Firebase Storage
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

  const bucket = admin.storage().bucket().name;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
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

function mapStyleProfileToFirestore(profile: Partial<StyleProfile>): Partial<FirestoreUser> {
  return {
    style_archetypes: profile.styleArchetypes,
    color_palettes: profile.colorPalettes,
    favorite_colors: profile.favoriteColors,
    favorite_brands: profile.favoriteBrands,
    body_type: profile.bodyType,
    avatar_url: profile.avatar_url,
    is_premium: profile.isPremium,
    is_onboarded: profile.isOnboarded,
  };
}

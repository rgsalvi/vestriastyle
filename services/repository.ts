import { getSupabaseClient } from './supabaseClient';
import type { StyleProfile, PersistentWardrobeItem } from '../types';

// ============================================================================
// FEATURE FLAG: Switch between Firestore and Supabase implementations
// ============================================================================
// Set via environment variable: VITE_USE_FIRESTORE=true (client-side)
// or: USE_FIRESTORE=true (server-side in Vercel)
function useFirestore(): boolean {
  // Client-side
  if (typeof window !== 'undefined') {
    return (import.meta as any).env?.VITE_USE_FIRESTORE === 'true';
  }
  // Server-side
  return process.env.USE_FIRESTORE === 'true';
}

// Conditionally import Firestore implementation (lazy-loaded to avoid import errors if not used)
let firestoreImpl: typeof import('./repository-firestore') | null = null;
async function getFirestoreImpl() {
  if (!firestoreImpl) {
    firestoreImpl = await import('./repository-firestore');
  }
  return firestoreImpl;
}

// ============================================================================
// SUPABASE IMPLEMENTATIONS (fallback/legacy)
// ============================================================================

// Supabase helpers
function mapRowToProfile(row: any): StyleProfile {
  if (!row) return row;
  return {
    styleArchetypes: row.style_archetypes || [],
    colorPalettes: row.color_palettes || [],
    favoriteColors: row.favorite_colors || '',
    favoriteBrands: row.favorite_brands || '',
    bodyType: row.body_type || 'None',
    avatar_url: row.avatar_url || undefined,
    isPremium: row.is_premium || false,
    isOnboarded: row.is_onboarded || false,
  };
}

function mapProfileToRow(uid: string, profile: Partial<StyleProfile>): Record<string, any> {
  return {
    id: uid,
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

async function sbLoadUserProfile(uid: string): Promise<StyleProfile | null> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('users').select('*').eq('id', uid).single();
  if (error) {
    if (error.code === 'PGRST116') return null; // no row
    console.warn('[supabase] load profile error', error);
    throw error;
  }
  return mapRowToProfile(data);
}

async function sbSaveUserProfile(uid: string, profile: Partial<StyleProfile>): Promise<void> {
  const sb = getSupabaseClient();
  const payload = mapProfileToRow(uid, profile);
  // If caller passed through email/display_name (rare), include them to avoid null constraint issues on first write.
  if ((profile as any).email) (payload as any).email = (profile as any).email;
  if ((profile as any).display_name) (payload as any).display_name = (profile as any).display_name;
  // Strip undefined keys so we don't null-out existing columns on upsert
  Object.keys(payload).forEach((k) => {
    if ((payload as any)[k] === undefined) delete (payload as any)[k];
  });
  const { error } = await sb.from('users').upsert(payload, { onConflict: 'id' });
  if (error) { console.warn('[supabase] save profile error', error); throw error; }
}

async function sbListWardrobe(uid: string): Promise<PersistentWardrobeItem[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('wardrobe_items').select('*').eq('user_id', uid).order('created_at', { ascending: true });
  if (error) { console.warn('[supabase] list wardrobe error', error); throw error; }
  return (data || []).map((r: any) => ({ id: r.id, ...r }) as any);
}

async function sbSaveWardrobe(uid: string, items: PersistentWardrobeItem[]): Promise<void> {
  const sb = getSupabaseClient();
  if (!items.length) return;
  const rows = items.map(i => ({ ...i, user_id: uid }));
  const { error } = await sb.from('wardrobe_items').upsert(rows, { onConflict: 'id' });
  if (error) { console.warn('[supabase] save wardrobe error', error); throw error; }
}

async function sbUploadAvatar(uid: string, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) throw new Error('Unsupported avatar format');
  let idToken: string | undefined;
  try {
    const mod = await import('../services/firebase');
    const auth = (mod as any).auth as any;
    if (auth?.currentUser) {
      idToken = await auth.currentUser.getIdToken();
    }
  } catch {}
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
}

export function getSupabaseAvatarPublicUrl(path: string): string {
  if (!path) return `https://ui-avatars.com/api/?name=User`;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const base = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  if (!base) {
    console.warn('[supabase] VITE_SUPABASE_URL missing; using ui-avatars fallback');
    return `https://ui-avatars.com/api/?name=User`;
  }
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

// ============================================================================
// EXPORTED FUNCTIONS WITH FEATURE FLAG ROUTING
// ============================================================================

export async function repositoryLoadUserProfile(uid: string) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryLoadUserProfile(uid);
  }
  return sbLoadUserProfile(uid);
}

export async function repositorySaveUserProfile(uid: string, profile: Partial<StyleProfile>) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositorySaveUserProfile(uid, profile);
  }
  return sbSaveUserProfile(uid, profile);
}

export async function repositoryEnsureUserRow(uid: string, email: string, displayName: string) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryEnsureUserRow(uid, email, displayName);
  }
  const sb = getSupabaseClient();
  const safeEmail = email || `${uid}@placeholder.local`;
  try {
    const { data, error: selErr } = await sb.from('users').select('id').eq('id', uid).single();
    if (selErr && (selErr as any).code !== 'PGRST116') {
      console.warn('[supabase] ensure user row: select failed', selErr);
    }
    if (data?.id) return;
  } catch {}
  const payload: any = { id: uid, email: safeEmail, display_name: displayName || safeEmail, created_at: new Date().toISOString() };
  const { error } = await sb.from('users').insert(payload);
  if (error) console.warn('[supabase] ensure user row insert error', error);
}

export async function repositoryListWardrobe(uid: string) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryListWardrobe(uid);
  }
  return sbListWardrobe(uid);
}

export async function repositorySaveWardrobeItems(uid: string, items: PersistentWardrobeItem[]) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositorySaveWardrobeItems(uid, items);
  }
  return sbSaveWardrobe(uid, items);
}

export async function repositoryUploadAvatar(uid: string, dataUrl: string) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryUploadAvatar(uid, dataUrl);
  }
  return sbUploadAvatar(uid, dataUrl);
}

export async function repositoryDeleteAllUserData(uid: string) {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryDeleteAllUserData(uid);
  }
  const sb = getSupabaseClient();
  const { error: wErr } = await sb.from('wardrobe_items').delete().eq('user_id', uid);
  if (wErr) console.warn('[supabase] delete wardrobe items error', wErr);
  const { error: uErr } = await sb.from('users').delete().eq('id', uid);
  if (uErr) console.warn('[supabase] delete user row error', uErr);
}

export async function repositoryLoadUserIdentity(uid: string): Promise<{ display_name: string | null; date_of_birth: string | null; first_name?: string | null; last_name?: string | null }> {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryLoadUserIdentity(uid);
  }
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('users').select('display_name,date_of_birth,first_name,last_name').eq('id', uid).single();
  if (error) {
    if ((error as any).code === 'PGRST116') return { display_name: null, date_of_birth: null };
    console.warn('[supabase] load identity error', error);
    throw error;
  }
  return {
    display_name: (data as any)?.display_name ?? null,
    date_of_birth: (data as any)?.date_of_birth ?? null,
    first_name: (data as any)?.first_name ?? null,
    last_name: (data as any)?.last_name ?? null,
  };
}

export async function repositoryUpdateIdentity(args: { firstName?: string; lastName?: string; dateOfBirth?: string }): Promise<void> {
  let idToken: string | undefined;
  try {
    const mod = await import('../services/firebase');
    const auth = (mod as any).auth as any;
    if (auth?.currentUser) idToken = await auth.currentUser.getIdToken();
  } catch {}

  let body = args as any;
  if (useFirestore()) {
    try {
      const mod = await import('../services/firebase');
      const auth = (mod as any).auth as any;
      if (auth?.currentUser) {
        body = { ...args, uid: auth.currentUser.uid };
      }
    } catch {}
  }

  const resp = await fetch('/api/update-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.json().catch(() => ({} as any));
    throw new Error(t?.message || `Failed to update identity (${resp.status})`);
  }
}

export async function repositoryFindUserByEmail(email: string): Promise<{ display_name: string | null; first_name: string | null } | null> {
  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.repositoryFindUserByEmail(email);
  }
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('users').select('display_name,first_name').eq('email', email).single();
  if (error) {
    if ((error as any).code === 'PGRST116') return null;
    console.warn('[supabase] find user by email error', error);
    return null;
  }
  return { display_name: (data as any)?.display_name ?? null, first_name: (data as any)?.first_name ?? null };
}

/**
 * Get public URL for avatar based on backend (Firestore or Supabase)
 */
export async function getAvatarPublicUrl(path: string): Promise<string> {
  if (!path) return `https://ui-avatars.com/api/?name=User`;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;

  if (useFirestore()) {
    const impl = await getFirestoreImpl();
    return impl.getFirebaseStorageAvatarPublicUrl(path);
  }
  return getSupabaseAvatarPublicUrl(path);
}

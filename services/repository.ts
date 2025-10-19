import { getSupabaseClient } from './supabaseClient';
import type { StyleProfile, PersistentWardrobeItem } from '../types';

// Force Supabase for all data persistence (Firebase only for Auth retained)
function useSupabase() { return true; }

// Supabase helpers (minimal now)
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
  // Upsert each item; could be optimized with RPC/batch later.
  const rows = items.map(i => ({ ...i, user_id: uid }));
  const { error } = await sb.from('wardrobe_items').upsert(rows, { onConflict: 'id' });
  if (error) { console.warn('[supabase] save wardrobe error', error); throw error; }
}

async function sbUploadAvatar(uid: string, dataUrl: string): Promise<string> {
  // Expect dataUrl like data:image/jpeg;base64,...
  if (!dataUrl.startsWith('data:')) throw new Error('Unsupported avatar format');
  let blob: Blob;
  try {
    // Use fetch to decode the data URL into a Blob for best compatibility
    const resp = await fetch(dataUrl);
    blob = await resp.blob();
  } catch (e) {
    console.warn('[supabase] failed to convert data URL to blob', e);
    throw new Error('Avatar upload failed: invalid image data');
  }
  const mime = (blob && (blob as any).type) || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  const path = `users/${uid}/avatar.${ext}`;
  const sb = getSupabaseClient();
  // Upload (upsert)
  const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: mime, upsert: true });
  if (error) {
    console.warn('[supabase] avatar upload error', error);
    throw new Error(`Avatar upload failed`);
  }
  return path; // store path only
}

export async function repositoryLoadUserProfile(uid: string) { return sbLoadUserProfile(uid); }
export async function repositorySaveUserProfile(uid: string, profile: Partial<StyleProfile>) { return sbSaveUserProfile(uid, profile); }
export async function repositoryListWardrobe(uid: string) { return sbListWardrobe(uid); }
export async function repositorySaveWardrobeItems(uid: string, items: PersistentWardrobeItem[]) { return sbSaveWardrobe(uid, items); }
export async function repositoryUploadAvatar(uid: string, dataUrl: string) { return sbUploadAvatar(uid, dataUrl); }
export async function repositoryDeleteAllUserData(uid: string) {
  const sb = getSupabaseClient();
  const { error: wErr } = await sb.from('wardrobe_items').delete().eq('user_id', uid);
  if (wErr) console.warn('[supabase] delete wardrobe items error', wErr);
  const { error: uErr } = await sb.from('users').delete().eq('id', uid);
  if (uErr) console.warn('[supabase] delete user row error', uErr);
}

export function getSupabaseAvatarPublicUrl(path: string): string {
  if (!path) return `https://ui-avatars.com/api/?name=User`;
  // If already a URL or data URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const base = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  if (!base) {
    console.warn('[supabase] VITE_SUPABASE_URL missing; using ui-avatars fallback');
    return `https://ui-avatars.com/api/?name=User`;
  }
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

export async function repositoryEnsureUserRow(uid: string, email: string, displayName: string) {
  const sb = getSupabaseClient();
  const safeEmail = email || `${uid}@placeholder.local`;
  const payload: any = { id: uid, email: safeEmail, display_name: displayName || safeEmail, created_at: new Date().toISOString() };
  const { error } = await sb.from('users').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('[supabase] ensure user row error', error);
}

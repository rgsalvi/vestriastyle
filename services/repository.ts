// Legacy Firestore imports kept only for avatar upload fallback (soon removable)
import { loadUserProfile as fsLoad, saveUserProfile as fsSave, listWardrobe as fsList, saveWardrobeItems as fsSaveWardrobe, uploadAvatar as fsUploadAvatar, deleteAllUserData as fsDeleteAll } from './db';
import { getSupabaseClient } from './supabaseClient';
import type { StyleProfile, PersistentWardrobeItem } from '../types';

// Force Supabase for all data persistence (Firebase only for Auth retained)
function useSupabase() { return true; }

// Supabase helpers (minimal now)
async function sbLoadUserProfile(uid: string): Promise<StyleProfile | null> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('users').select('*').eq('id', uid).single();
  if (error) {
    if (error.code === 'PGRST116') return null; // no row
    console.warn('[supabase] load profile error', error);
    throw error;
  }
  return data as any;
}

async function sbSaveUserProfile(uid: string, profile: Partial<StyleProfile>): Promise<void> {
  const sb = getSupabaseClient();
  const payload = { id: uid, ...profile };
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
  if (!dataUrl.startsWith('data:image/')) throw new Error('Unsupported avatar format');
  const mime = dataUrl.substring(5, dataUrl.indexOf(';')); // image/jpeg
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid image data');
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const ext = mime.split('/')[1] || 'jpg';
  const path = `users/${uid}/avatar.${ext}`;
  const sb = getSupabaseClient();
  // Upload (upsert)
  const { error } = await sb.storage.from('avatars').upload(path, bytes, { contentType: mime, upsert: true });
  if (error) { console.warn('[supabase] avatar upload error', error); throw new Error('Avatar upload failed'); }
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
  // path like users/{uid}/avatar.jpg
  const sb = getSupabaseClient();
  const { data } = sb.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function repositoryEnsureUserRow(uid: string, email: string, displayName: string) {
  const sb = getSupabaseClient();
  const payload: any = { id: uid, email, display_name: displayName, created_at: new Date().toISOString() };
  const { error } = await sb.from('users').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('[supabase] ensure user row error', error);
}

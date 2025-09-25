import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { app, auth } from './firebase';
import { restGetDocument, restPatchDocument } from './firestoreRest';
import type { StyleProfile, PersistentWardrobeItem } from '../types';

export const db = getFirestore(app);
export const storage = getStorage(app);

export const userDocRef = (uid: string) => doc(db, 'users', uid);
// Store profile fields directly on the user doc (users/{uid})
export const profileDocRef = (uid: string) => doc(db, 'users', uid);
export const wardrobeColRef = (uid: string) => collection(db, 'users', uid, 'wardrobe');

export async function loadUserProfile(uid: string): Promise<StyleProfile | null> {
  try {
    const rest = await restGetDocument(`users/${uid}`);
    if (rest) return rest as StyleProfile;
  } catch (e) {
    console.warn('[profile-load] REST get failed, falling back to SDK', e);
  }
  let snap = await getDoc(profileDocRef(uid));
  if (snap.exists()) return snap.data() as StyleProfile;
  const legacy = await getDoc(doc(db, 'users', uid, 'meta', 'profile'));
  return legacy.exists() ? (legacy.data() as StyleProfile) : null;
}

export async function saveUserProfile(uid: string, profile: Partial<StyleProfile>): Promise<void> {
  const started = Date.now();
  console.log('[profile-save] start(rest-first)', { uid, keys: Object.keys(profile || {}) });
  try {
    await restPatchDocument(`users/${uid}`, { ...profile, updatedAt: new Date().toISOString() });
    console.log('[profile-save] success(rest)', { uid, ms: Date.now() - started });
    return;
  } catch (re) {
    console.warn('[profile-save] REST failed, trying SDK', re);
  }
  try {
    await setDoc(profileDocRef(uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
    console.log('[profile-save] success(sdk-fallback)', { uid, ms: Date.now() - started });
  } catch (sdkErr) {
    console.warn('[profile-save] failed(both)', sdkErr);
    throw sdkErr;
  }
}

export async function uploadAvatar(uid: string, dataUrl: string): Promise<string> {
  const r = ref(storage, `users/${uid}/avatar.jpg`);
  await uploadString(r, dataUrl, 'data_url');
  return await getDownloadURL(r);
}

export async function listWardrobe(uid: string): Promise<PersistentWardrobeItem[]> {
  const q = query(wardrobeColRef(uid), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function saveWardrobeItems(uid: string, items: PersistentWardrobeItem[]): Promise<void> {
  const batch = writeBatch(db);
  const col = wardrobeColRef(uid);
  items.forEach(item => {
    const docRef = item.id ? doc(col, item.id) : doc(col);
    batch.set(docRef, { ...item, createdAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}

export async function deleteAllUserData(uid: string): Promise<void> {
  // delete profile doc
  try { await deleteDoc(profileDocRef(uid)); } catch {}
  // delete wardrobe docs
  const snap = await getDocs(wardrobeColRef(uid));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  // delete avatar file
  try { await deleteObject(ref(storage, `users/${uid}/avatar.jpg`)); } catch {}
}

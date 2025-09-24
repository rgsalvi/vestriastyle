import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { app, auth } from './firebase';
import type { StyleProfile, PersistentWardrobeItem } from '../types';

export const db = getFirestore(app);
export const storage = getStorage(app);

export const userDocRef = (uid: string) => doc(db, 'users', uid);
// Store profile fields directly on the user doc (users/{uid})
export const profileDocRef = (uid: string) => doc(db, 'users', uid);
export const wardrobeColRef = (uid: string) => collection(db, 'users', uid, 'wardrobe');

export async function loadUserProfile(uid: string): Promise<StyleProfile | null> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) {
      const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${idToken}` } });
      const data = await res.json();
      if (res.ok && data?.success) return data.profile as StyleProfile | null;
      console.warn('Server profile GET failed:', data);
    }
  } catch {}
  // Fallback to client SDK
  let snap = await getDoc(profileDocRef(uid));
  if (snap.exists()) return snap.data() as StyleProfile;
  // Fallback to legacy location users/{uid}/meta/profile
  const legacy = await getDoc(doc(db, 'users', uid, 'meta', 'profile'));
  return legacy.exists() ? (legacy.data() as StyleProfile) : null;
}

export async function saveUserProfile(uid: string, profile: Partial<StyleProfile>): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ profile }) });
      if (res.ok) return;
      try { const data = await res.json(); console.warn('Server profile PUT failed:', data); } catch {}
    }
  } catch {}
  await setDoc(profileDocRef(uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
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

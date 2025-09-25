import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, sendEmailVerification, sendPasswordResetEmail, User as FbUser, updateProfile, UserCredential, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdw-72plQ9WDlSBn3c_dQopah6-FLNqAg",
  authDomain: "ai-wardrobe-curator.firebaseapp.com",
  projectId: "ai-wardrobe-curator",
  storageBucket: "ai-wardrobe-curator.appspot.com",
  messagingSenderId: "79620949788",
  appId: "1:79620949788:web:b00eaa99abdbd4569b1cd9",
  measurementId: "G-N7K4N9K8V2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

export const observeAuth = (cb: (user: FbUser | null) => void) => onAuthStateChanged(auth, cb);
export const signUp = (email: string, password: string, displayName?: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password).then(async (cred: UserCredential) => {
    // Track signup_start (fire-and-forget; endpoint may ignore if unauth yet)
    try {
      fetch('/api/track-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'signup_start', meta: { email: cred.user.email } }) });
    } catch {}
    if (displayName) {
      try { await updateProfile(cred.user, { displayName }); } catch {}
    }
    await sendEmailVerification(cred.user);
    try { sessionStorage.setItem('newlySignedUpUid', cred.user.uid); } catch {}
    // Immediately create user doc with isOnboarded:false so sign-in logic can rely on flag
    try {
      console.log('[signup] creating initial user doc');
      await setDoc(doc(db, 'users', cred.user.uid), {
        isOnboarded: false,
        createdAt: serverTimestamp(),
        email: cred.user.email || email,
        name: displayName || cred.user.displayName || cred.user.email || 'User'
      }, { merge: true });
      console.log('[signup] initial user doc created');
    } catch (e) { console.warn('[signup] failed to create initial user doc', e); }
    return cred;
  });
export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const signOut = () => fbSignOut(auth);
export const resendVerification = async () => { if (auth.currentUser) await sendEmailVerification(auth.currentUser); };
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
export const updateUserProfile = async (displayName?: string, photoURL?: string) => {
  if (!auth.currentUser) return;
  await updateProfile(auth.currentUser, {
    displayName: displayName ?? auth.currentUser.displayName ?? undefined,
    photoURL: photoURL ?? auth.currentUser.photoURL ?? undefined,
  });
};
export const deleteCurrentUser = async () => {
  if (!auth.currentUser) return;
  await deleteUser(auth.currentUser);
};

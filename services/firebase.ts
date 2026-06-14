import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, sendEmailVerification, sendPasswordResetEmail, User as FbUser, updateProfile, UserCredential, deleteUser } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, serverTimestamp, setLogLevel, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUg5U7c-KR7GGpusHQZTSqqucD1In_0NI",
  authDomain: "vestria-style.firebaseapp.com",
  projectId: "vestria-style",
  storageBucket: "vestria-style.firebasestorage.app",
  messagingSenderId: "195881749027",
  appId: "1:195881749027:web:2e6d600593f7ccc60dff96"
};

export const app = initializeApp(firebaseConfig);
// Initialize Firestore with standard settings (WebSocket by default)
export const db = initializeFirestore(app, {});
// Optional debug logging: set localStorage FIRESTORE_DEBUG=true (dev only)
try {
  if (typeof window !== 'undefined' && localStorage.getItem('FIRESTORE_DEBUG') === 'true') {
    setLogLevel('debug');
    // eslint-disable-next-line no-console
    console.log('[firestore] debug log level enabled');
  }
} catch {}
export const auth = getAuth(app);

export const observeAuth = (cb: (user: FbUser | null) => void) => onAuthStateChanged(auth, cb);
export const sendVerificationEmail = async () => { if (auth.currentUser) await sendEmailVerification(auth.currentUser); };
export const signUp = (email: string, password: string, displayName?: string, skipEmailVerification?: boolean): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password).then(async (cred: UserCredential) => {
    // Track signup_start (fire-and-forget; endpoint may ignore if unauth yet)
    try {
      fetch('/api/track-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'signup_start', meta: { email: cred.user.email } }) });
    } catch {}

    if (displayName) {
      try { await updateProfile(cred.user, { displayName }); } catch {}
    }

    // Create Firestore user document with defaults so profile loads and banner can show
    try {
      const userRef = doc(db, 'users', cred.user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          id: cred.user.uid,
          email: cred.user.email,
          display_name: displayName || cred.user.email?.split('@')[0] || 'User',
          isOnboarded: false,
          isPremium: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('[signUp] Failed to create user document in Firestore', e);
    }

    if (!skipEmailVerification) {
      await sendEmailVerification(cred.user);
    }

    try { sessionStorage.setItem('newlySignedUpUid', cred.user.uid); } catch {}
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

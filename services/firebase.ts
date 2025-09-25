import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, sendEmailVerification, sendPasswordResetEmail, User as FbUser, updateProfile, UserCredential, deleteUser } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, serverTimestamp, setLogLevel } from 'firebase/firestore';
import { restPatchDocument } from './firestoreRest';

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
// Force long polling to bypass WebChannel 400 issues (network/referrer quirks)
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
// Log configuration once (dev aid)
try { if (typeof window !== 'undefined') console.log('[firestore-config] initialized with experimentalForceLongPolling=true'); } catch {}
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
    // Immediately create user doc (REST-first to bypass WebChannel 400 issues) with isOnboarded:false
    const baseProfile = {
      isOnboarded: false,
      email: cred.user.email || email,
      name: displayName || cred.user.displayName || cred.user.email || 'User'
    };
    try {
      console.log('[signup] creating initial user doc (rest-first)');
      await restPatchDocument(`users/${cred.user.uid}`, { ...baseProfile, createdAt: new Date().toISOString(), createdVia: 'rest' });
      console.log('[signup] initial user doc created (rest)');
    } catch (restErr: any) {
      console.warn('[signup] rest create failed, falling back to sdk', { message: restErr?.message });
      try {
        await setDoc(doc(db, 'users', cred.user.uid), { ...baseProfile, createdAt: serverTimestamp(), createdVia: 'sdk-fallback' }, { merge: true });
        console.log('[signup] initial user doc created (sdk-fallback)');
      } catch (sdkErr: any) {
        const code = sdkErr?.code || sdkErr?.message?.match(/\b([A-Z_]{3,})\b/)?.[1];
        console.warn('[signup] sdk fallback failed, attempting server admin fallback', { code, message: sdkErr?.message });
        try {
          const idToken = await cred.user.getIdToken();
          const resp = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ profile: { ...baseProfile, createdVia: 'server-fallback' } })
          });
          if (resp.ok) {
            console.log('[signup] server fallback profile created');
          } else {
            const txt = await resp.text();
            console.warn('[signup] server fallback profile failed', txt);
          }
        } catch (srvErr) {
          console.warn('[signup] server fallback profile exception', srvErr);
        }
      }
    }
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

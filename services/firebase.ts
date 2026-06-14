import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, sendEmailVerification, sendPasswordResetEmail, User as FbUser, updateProfile, UserCredential, deleteUser } from 'firebase/auth';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCUg5U7c-KR7GGpusHQZTSqqucD1In_0NI",
  authDomain: "vestria-style.firebaseapp.com",
  projectId: "vestria-style",
  storageBucket: "vestria-style.firebasestorage.app",
  messagingSenderId: "195881749027",
  appId: "1:195881749027:web:2e6d600593f7ccc60dff96"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app, 'https://vestria-style-default-rtdb.asia-southeast1.firebasedatabase.app');
export const auth = getAuth(app);

export const observeAuth = (cb: (user: FbUser | null) => void) => onAuthStateChanged(auth, cb);
export const sendVerificationEmail = async () => { if (auth.currentUser) await sendEmailVerification(auth.currentUser); };

export const signUp = (email: string, password: string, displayName?: string, skipEmailVerification?: boolean): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password).then(async (cred: UserCredential) => {
    try {
      fetch('/api/track-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'signup_start', meta: { email: cred.user.email } }) });
    } catch {}

    if (displayName) {
      try { await updateProfile(cred.user, { displayName }); } catch {}
    }

    // Save user profile to Realtime Database
    try {
      const userRef = ref(db, `users/${cred.user.uid}`);
      await set(userRef, {
        uid: cred.user.uid,
        email: cred.user.email,
        display_name: displayName || cred.user.email?.split('@')[0] || 'User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_onboarded: false,
        is_premium: false,
      });
      console.log('[signUp] User profile saved to database');
    } catch (e) {
      console.error('[signUp] Failed to save user profile:', (e as any)?.message);
    }

    // Send verification email
    if (!skipEmailVerification) {
      try {
        console.log('[signUp] Preparing to send verification email for', cred.user.email);
        await new Promise(r => setTimeout(r, 100));
        if (!cred.user.email) {
          throw new Error('User email is not set');
        }
        if (auth.currentUser) {
          console.log('[signUp] Sending via auth.currentUser');
          await sendEmailVerification(auth.currentUser);
          console.log('[signUp] ✓ Verification email sent successfully to', auth.currentUser.email);
        } else {
          console.log('[signUp] Sending via credential');
          await sendEmailVerification(cred.user);
          console.log('[signUp] ✓ Verification email sent successfully');
        }
      } catch (emailError: any) {
        console.error('[signUp] ✗ Failed to send verification email', emailError?.message || emailError);
      }
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

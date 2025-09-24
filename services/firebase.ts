import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, sendEmailVerification, sendPasswordResetEmail, User as FbUser, updateProfile, UserCredential, deleteUser } from 'firebase/auth';

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

export const observeAuth = (cb: (user: FbUser | null) => void) => onAuthStateChanged(auth, cb);
export const signUp = (email: string, password: string, displayName?: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password).then(async (cred: UserCredential) => {
    if (displayName) {
      try { await updateProfile(cred.user, { displayName }); } catch {}
    }
    await sendEmailVerification(cred.user);
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

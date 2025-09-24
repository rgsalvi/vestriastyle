import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Expect the following env vars to be set in Vercel:
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Note: For FIREBASE_PRIVATE_KEY, replace literal \n with real newlines in Vercel settings.

function initAdmin(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env vars. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }

  // Handle escaped newlines from env storage
  privateKey = privateKey.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const app = getApps().length ? getApps()[0] : initAdmin();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
// Placeholder for future Firebase Admin integration. Currently unused to avoid requiring firebase-admin in frontend build.
export {};
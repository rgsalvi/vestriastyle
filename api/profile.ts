import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, adminDb } from './_firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require Firebase ID token
  const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!idToken) return res.status(401).json({ success: false, message: 'Missing Authorization token.' });
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  // Store profile fields directly on the user doc
  const docRef = adminDb.doc(`users/${uid}`);

  if (req.method === 'GET') {
    try {
      let snap = await docRef.get();
      let data = snap.exists ? snap.data() : null;
      // Fallback to legacy path
      if (!data) {
        const legacy = await adminDb.doc(`users/${uid}/meta/profile`).get();
        data = legacy.exists ? legacy.data() : null;
      }
      return res.status(200).json({ success: true, profile: data });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to load profile.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const profile = body?.profile || {};
  await docRef.set({ ...profile, updatedAt: (await import('firebase-admin/firestore')).FieldValue.serverTimestamp() }, { merge: true });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to save profile.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

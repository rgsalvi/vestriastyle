import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { getFirebaseAdmin } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require Firebase ID token
  const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!idToken) return res.status(401).json({ success: false, message: 'Missing Authorization token.' });

  let uid: string;
  try {
    const adm = getFirebaseAdmin();
    const decoded = await adm.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  const adm = getFirebaseAdmin();
  const adminDb = adm.firestore();
  const docRef = adminDb.collection('users').doc(uid);

  if (req.method === 'GET') {
    try {
      const snap = await docRef.get();
      const data = snap.exists ? snap.data() : null;
      return res.status(200).json({ success: true, profile: data });
    } catch (e: any) {
      console.error('[profile-get] error:', e);
      return res.status(500).json({ success: false, message: 'Failed to load profile.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const profile = body?.profile || {};

      // Remove undefined keys to avoid nulling out existing data
      Object.keys(profile).forEach(key => {
        if (profile[key] === undefined) delete profile[key];
      });

      await docRef.set(
        {
          ...profile,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.status(200).json({ success: true });
    } catch (e: any) {
      console.error('[profile-put] error:', e);
      return res.status(500).json({ success: false, message: 'Failed to save profile.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}


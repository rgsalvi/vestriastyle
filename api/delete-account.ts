import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { getFirebaseAdmin } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

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

  try {
    const adm = getFirebaseAdmin();
    const adminDb = adm.firestore();
    const bucket = admin.storage().bucket();

    // Delete all wardrobe items
    const itemsSnapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('items')
      .get();

    const batch = adminDb.batch();
    itemsSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Delete user document
    await adminDb.collection('users').doc(uid).delete().catch(() => {});

    // Delete premium document if exists
    await adminDb.collection('premium').doc(uid).delete().catch(() => {});

    // Delete avatar from storage (best-effort)
    // Try all possible avatar formats
    const avatarPatterns = [
      `avatars/${uid}/avatar.jpg`,
      `avatars/${uid}/avatar.jpeg`,
      `avatars/${uid}/avatar.png`,
      `avatars/${uid}/avatar.webp`,
      `avatars/${uid}/avatar.gif`,
    ];

    for (const pattern of avatarPatterns) {
      try {
        await bucket.file(pattern).delete({ ignoreNotFound: true });
      } catch {
        // Ignore individual failures
      }
    }

    console.log(`[delete-account] Successfully deleted all data for user ${uid}`);
    return res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (e: any) {
    console.error('[delete-account] error:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete user data.' });
  }
}


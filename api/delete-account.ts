import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, adminDb } from './_firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  try {
  // Delete user doc (new profile location) and legacy profile doc
  await adminDb.doc(`users/${uid}`).delete().catch(() => {});
    await adminDb.doc(`users/${uid}/meta/profile`).delete().catch(() => {});
    // Delete wardrobe docs
    const wardSnap = await adminDb.collection(`users/${uid}/wardrobe`).get();
    const batch = adminDb.batch();
    wardSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    // Delete avatar from storage (best-effort)
    try {
      const bucket = getStorage().bucket();
      // Our uploads use users/{uid}/avatar.jpg
      await bucket.file(`users/${uid}/avatar.jpg`).delete({ ignoreNotFound: true });
    } catch {}
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to delete user data.' });
  }
}

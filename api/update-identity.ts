import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { getFirebaseAdmin } from './_lib/firebaseAdmin';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!idToken) return res.status(401).json({ success: false, message: 'Missing Authorization token.' });

    const adm = getFirebaseAdmin();
    let uid: string;
    try {
      const decoded = await adm.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const { firstName, lastName, dateOfBirth } = req.body || {};
    if (!firstName && !lastName && !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'At least one of firstName, lastName or dateOfBirth must be provided.',
      });
    }

    // Validate dateOfBirth format if provided
    if (dateOfBirth) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        return res.status(400).json({ success: false, message: 'dateOfBirth must be YYYY-MM-DD.' });
      }
      const dt = new Date(dateOfBirth);
      const now = new Date();
      if (Number.isNaN(dt.getTime()) || dt > now) {
        return res.status(400).json({ success: false, message: 'dateOfBirth must be a valid date in the past.' });
      }
    }

    // Prepare payload for Firestore
    const fn = (firstName ?? '').toString().trim();
    const ln = (lastName ?? '').toString().trim();
    const displayName = `${fn} ${ln}`.trim();

    const payload: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (fn) payload.first_name = fn;
    if (ln) payload.last_name = ln;
    if (displayName) payload.display_name = displayName;
    if (dateOfBirth) payload.date_of_birth = dateOfBirth;

    const db = adm.firestore();
    await db.collection('users').doc(uid).set(payload, { merge: true });

    console.log(`[api/update-identity] updated for ${uid}`);
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('[api/update-identity] error', e);
    return res.status(500).json({ success: false, message: e?.message || 'Unexpected error' });
  }
}


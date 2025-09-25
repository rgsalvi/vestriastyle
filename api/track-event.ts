import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, adminDb } from './_firebaseAdmin';

// Minimal event tracking endpoint. Stores events in Firestore under analytic_events/{date}/events/{auto-id}
// Event shape: { type, uid (optional), createdAt, meta }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  try {
    const authHeader = req.headers.authorization;
    let uid: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (e) {
        // ignore invalid tokens; event can still be stored anonymously
      }
    }
    const { type, meta } = req.body || {};
    if (!type || typeof type !== 'string') return res.status(400).json({ error: 'INVALID_EVENT_TYPE' });
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
    await adminDb.collection('analytic_events').doc(dateKey).collection('events').add({
      type,
      uid: uid || null,
      meta: meta || null,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'] || null,
    });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('[track-event] failed', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}
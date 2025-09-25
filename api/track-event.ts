import { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy admin import so missing env vars do not cause a hard 500 for analytics.
let adminReady = false;
let adminAuth: any = null;
let adminDb: any = null;
async function ensureAdmin() {
  if (adminReady) return adminReady;
  try {
    const { adminAuth: aAuth, adminDb: aDb } = await import('./_firebaseAdmin');
    adminAuth = aAuth; adminDb = aDb; adminReady = true; return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[track-event] admin not initialized (env missing?) – falling back to no-op');
    adminReady = false; return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  let body: any = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch {}
  const { type, meta } = body;
  if (!type || typeof type !== 'string') return res.status(400).json({ error: 'INVALID_EVENT_TYPE' });

  const ok = await ensureAdmin();
  if (!ok) {
    // Best-effort swallow: still return success so client isn't noisy.
    return res.status(204).end();
  }
  try {
    let uid: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      try { const decoded = await adminAuth.verifyIdToken(token); uid = decoded.uid; } catch {}
    }
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    await adminDb.collection('analytic_events').doc(dateKey).collection('events').add({
      type,
      uid: uid || null,
      meta: meta || null,
      createdAt: now,
      userAgent: req.headers['user-agent'] || null,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.warn('[track-event] store failed – returning 204 fallback');
    return res.status(204).end();
  }
}
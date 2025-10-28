import * as admin from 'firebase-admin';

let initialized = false;

export function getFirebaseAdmin() {
  if (!initialized) {
    try {
      if (!admin.apps.length) {
        // Prefer GOOGLE_APPLICATION_CREDENTIALS or a base64 JSON in FIREBASE_SERVICE_ACCOUNT_JSON
        const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (b64) {
          const json = Buffer.from(b64, 'base64').toString('utf-8');
          const creds = JSON.parse(json);
          admin.initializeApp({ credential: admin.credential.cert(creds) });
        } else {
          admin.initializeApp();
        }
      }
      initialized = true;
    } catch (e) {
      // As a fallback, attempt default app
      try { if (!admin.apps.length) admin.initializeApp(); initialized = true; } catch {}
    }
  }
  return admin;
}

export async function verifyBearerIdToken(authHeader?: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    if (!authHeader) return null;
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    const adm = getFirebaseAdmin();
    const decoded = await adm.auth().verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

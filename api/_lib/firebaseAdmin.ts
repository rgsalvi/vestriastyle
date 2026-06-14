import * as admin from 'firebase-admin';

let initialized = false;

export function getFirebaseAdmin() {
  if (!initialized) {
    try {
      if (!admin.apps.length) {
        // Try base64 encoded service account JSON first
        const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (b64) {
          const json = Buffer.from(b64, 'base64').toString('utf-8');
          const creds = JSON.parse(json);
          admin.initializeApp({ credential: admin.credential.cert(creds) });
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
          // Construct credentials from individual env vars
          const creds = {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: 'key-id',
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: 'client-id',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
          };
          admin.initializeApp({ credential: admin.credential.cert(creds as any) });
        } else {
          admin.initializeApp();
        }
      }
      initialized = true;
    } catch (e) {
      console.error('[firebaseAdmin] initialization error:', e);
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

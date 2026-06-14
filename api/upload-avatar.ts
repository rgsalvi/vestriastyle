import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { getFirebaseAdmin } from './_lib/firebaseAdmin';

// Force Node.js runtime (not Edge) for Buffer support
export const config = { runtime: 'nodejs' };

const UPLOAD_DEBUG = (process.env.UPLOAD_DEBUG || '').toLowerCase() === 'true';

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer; ext: string } {
  // data:[<mime>];base64,<data>
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const b64 = match[2];
  const buffer = Buffer.from(b64, 'base64');
  const ext = (mime.split('/')[1] || 'jpg').toLowerCase();
  return { mime, buffer, ext };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Verify Firebase ID token
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

    // Parse body
    const { dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ success: false, message: 'Invalid or missing dataUrl.' });
    }

    const { mime, buffer, ext } = parseDataUrl(dataUrl);

    // Size guard (~10MB for Firebase)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (buffer.byteLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Image too large. Please upload an image under ${maxSizeBytes / 1024 / 1024}MB.`,
      });
    }

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const filePath = `avatars/${uid}/avatar.${ext}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: mime,
      },
      public: true, // Make public for easy retrieval
    });

    console.log(`[api/upload-avatar] uploaded ${filePath} (${buffer.byteLength} bytes)`);
    return res.status(200).json({ success: true, path: filePath });
  } catch (e: any) {
    console.error('[api/upload-avatar] error', e);
    const msg = e?.message || 'Unexpected error';
    return res.status(500).json({
      success: false,
      message: msg,
      ...(UPLOAD_DEBUG ? { error: e?.stack || String(e) } : {}),
    });
  }
}


import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth } from './_firebaseAdmin';
import { createClient } from '@supabase/supabase-js';

// Force Node.js runtime (not Edge) to ensure Buffer/Blob and firebase-admin support
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
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Read server env at request time; avoid crashing at module load
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.', debug: UPLOAD_DEBUG ? { SUPABASE_URL_present: !!SUPABASE_URL, SERVICE_KEY_present: !!SUPABASE_SERVICE_KEY } : undefined });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify Firebase ID token
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!idToken) return res.status(401).json({ success: false, message: 'Missing Authorization token.' });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Parse body
    const { dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ success: false, message: 'Invalid or missing dataUrl.' });
    }

    const { mime, buffer, ext } = parseDataUrl(dataUrl);
    // Basic size guard (~3MB)
    if (buffer.byteLength > 3 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: 'Image too large. Please upload an image under 3MB.' });
    }

    const path = `users/${uid}/avatar.${ext}`;
    // Convert Node Buffer to ArrayBuffer for best compatibility with supabase-js storage upload in Node runtimes
    // Convert Buffer -> ArrayBuffer for supabase-js storage upload
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
      contentType: mime,
      upsert: true,
    });
    if (error) {
      console.warn('[api/upload-avatar] supabase upload error', error);
      return res.status(500).json({ success: false, message: 'Upload failed.', ...(UPLOAD_DEBUG ? { error: error.message || String(error), path, mime, size: buffer.byteLength } : {}) });
    }

    return res.status(200).json({ success: true, path });
  } catch (e: any) {
    console.error('[api/upload-avatar] error', e);
    const msg = e?.message || 'Unexpected error';
    return res.status(500).json({ success: false, message: msg, ...(UPLOAD_DEBUG ? { error: e?.stack || String(e) } : {}) });
  }
}

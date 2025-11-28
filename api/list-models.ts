import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is not set.');
}

// Initialize firebase-admin with explicit service account credentials (idempotent)
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase admin credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ADMIN_EMAIL = 'support@vestria.style';
const PROBE_MODELS = [
  'imagen-4.0-generate-001',
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // Admin auth via Firebase ID token (Bearer token)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    const email = decoded.email || null;
    if (!email || email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch (e) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const listResp: any = await ai.models.list();
    const models = Array.isArray(listResp?.models) ? listResp.models : [];
    // Return concise fields
    const items = models.map((m: any) => ({
      name: m?.name,
      displayName: m?.displayName,
      description: m?.description,
    }));

    // If empty, fall back to probing a small set of known, stable IDs
    if (!items.length) {
      const probed: { name: string; ok: boolean; status: number | null; error?: string }[] = [];
      for (const name of PROBE_MODELS) {
        try {
          await ai.models.get({ model: name });
          probed.push({ name, ok: true, status: 200 });
        } catch (e: any) {
          const status = (e?.status as number) || null;
          probed.push({ name, ok: false, status, error: e?.message || String(e) });
        }
      }
      return res.status(200).json({
        count: 0,
        models: items,
        probed,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      count: models.length,
      models: items,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to list models', error: err?.message || String(err) });
  }
}

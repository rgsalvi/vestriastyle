import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is not set.');
}

// Lazy / idempotent init with explicit service account credentials
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase admin credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }
  // Handle escaped newlines in env var
  privateKey = privateKey.replace(/\\n/g, '\n');
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_MODELS = [
  'imagen-4.0-generate-001',
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // Auth check
  const adminEmail = 'support@vestria.style';
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }
  // Verify token and enforce admin email
  let verifiedEmail: string | null = null;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    verifiedEmail = decoded.email || null;
  } catch (e) {
    console.warn('[model-access-status] verifyIdToken failed', e);
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (!verifiedEmail || verifiedEmail !== adminEmail) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const listRaw = process.env.MODEL_STATUS_LIST;
  const models = (listRaw ? listRaw.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_MODELS);

  const results: { name: string; ok: boolean; status: number | null; error?: string }[] = [];
  for (const name of models) {
    try {
      // Adjusted for SDK: parameter key is `model` not `name`.
      await ai.models.get({ model: name });
      results.push({ name, ok: true, status: 200 });
    } catch (err: any) {
      // Attempt to extract status and message
      const status = (err?.status as number) || null;
      const message = err?.message || 'Error';
      results.push({ name, ok: false, status, error: message });
    }
  }

  return res.status(200).json({ models: results, timestamp: new Date().toISOString() });
}

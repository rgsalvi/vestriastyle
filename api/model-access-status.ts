import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is not set.');
}

// Lazy / idempotent init
if (!getApps().length) {
  try {
    initializeApp(); // Uses default credentials (set via env on Vercel). If none, token verification may fail.
  } catch (e) {
    console.warn('[model-access-status] firebase-admin init failed', e);
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_MODELS = [
  'imagen-4.0-generate-001',
  'imagen-4.1-pro-001',
  'gemini-2.5-flash-image-preview',
  'gemini-2.5-image-edit-001',
  'gemini-2.0-flash',
  'gemini-2.0-pro'
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
  try {
    const decoded = await getAuth().verifyIdToken(token);
    if (!decoded.email || decoded.email !== adminEmail) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch (e) {
    console.warn('[model-access-status] token verify failed', e);
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

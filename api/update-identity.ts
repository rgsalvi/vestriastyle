import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.' });
    }
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!idToken) return res.status(401).json({ success: false, message: 'Missing Authorization token.' });
    let adminAuth: any;
    try {
      const mod = await import('./_firebaseAdmin.js');
      adminAuth = (mod as any).adminAuth;
    } catch {
      const mod = await import('./_firebaseAdmin');
      adminAuth = (mod as any).adminAuth;
    }
    if (!adminAuth) return res.status(500).json({ success: false, message: 'Firebase Admin not available.' });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid as string;

    const { firstName, lastName, dateOfBirth } = req.body || {};
    if (!firstName && !lastName && !dateOfBirth) {
      return res.status(400).json({ success: false, message: 'At least one of firstName, lastName or dateOfBirth must be provided.' });
    }
    let display_name: string | undefined = undefined;
    if (firstName || lastName) {
      const fn = (firstName ?? '').toString().trim();
      const ln = (lastName ?? '').toString().trim();
      display_name = `${fn} ${ln}`.trim();
    }
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
    const payload: any = { id: uid };
    if (display_name) payload.display_name = display_name;
    if (dateOfBirth) payload.date_of_birth = dateOfBirth;
    const { error } = await sb.from('users').upsert(payload, { onConflict: 'id' });
    if (error) return res.status(500).json({ success: false, message: error.message || 'Failed to update identity.' });

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('[api/update-identity] error', e);
    return res.status(500).json({ success: false, message: e?.message || 'Unexpected error' });
  }
}

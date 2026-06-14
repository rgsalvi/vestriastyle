import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdmin } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const adm = getFirebaseAdmin();
    const db = adm.firestore();
    const snap = await db.collection('recipes').orderBy('date', 'asc').select('slug').get();
    const slugs = snap.docs.map(d => d.data().slug);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(slugs));
  } catch (e: any) {
    console.error('[recipes-index] error', e);
    return res.status(500).json({ message: 'Failed to load recipes index' });
  }
}

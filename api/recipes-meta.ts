import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdmin } from './_lib/firebaseAdmin';

type WeekMeta = {
  date: string;
  title: string;
  description: string[];
  flatlayAlt: string;
  modelAlt: string;
  slug: string;
  flatlayUrl?: string;
  modelUrl?: string;
  flatlay?: string;
  model?: string;
  founderId?: 'tanvi' | 'muskaan' | 'riddhi';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const slug = (req.query.slug as string | undefined)?.trim();
  if (!slug) return res.status(400).json({ message: 'Missing slug' });
  try {
    const adm = getFirebaseAdmin();
    const db = adm.firestore();
    const snap = await db.collection('recipes').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'Not found' });

    const data = snap.docs[0].data();
    const descArray: string[] = Array.isArray(data.description)
      ? (data.description as any[]).map((d: any) => `${(d?.lead || '').trim()}: ${(d?.body || '').trim()}`.replace(/: $/, ''))
      : [];

    const meta: WeekMeta = {
      date: String(data.date),
      title: data.title,
      description: descArray,
      flatlayAlt: data.flatlay_alt || `Flat lay of ${data.title} outfit`,
      modelAlt: data.model_alt || `Model wearing the ${data.title} outfit styled from the flat lay`,
      slug: data.slug,
      flatlayUrl: data.flatlay_url || undefined,
      modelUrl: data.model_url || undefined,
      founderId: data.founder_id,
    };

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(meta));
  } catch (e: any) {
    console.error('[recipes-meta] error', e);
    return res.status(500).json({ message: 'Failed to load recipe meta' });
  }
}

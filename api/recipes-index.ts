import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('recipes').select('slug,date').order('date', { ascending: true });
    if (error) throw error;
    const slugs = (data || []).map((r: any) => r.slug);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(slugs));
  } catch (e: any) {
    console.error('[recipes-index] error', e);
    return res.status(500).json({ message: 'Failed to load recipes index' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

type WeekMeta = {
  date: string;
  title: string;
  description: string[];
  flatlayAlt: string;
  modelAlt: string;
  slug: string;
  // Optional fields to help clients resolve image sources
  // If provided, these are absolute URLs (e.g., Supabase public storage URLs)
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
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('recipes').select('*').eq('slug', slug).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

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
      // For backward compatibility, also include file names if needed
    };

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(meta));
  } catch (e: any) {
    console.error('[recipes-meta] error', e);
    return res.status(500).json({ message: 'Failed to load recipe meta' });
  }
}

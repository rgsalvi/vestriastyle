import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { verifyBearerIdToken } from './_lib/firebaseAdmin';

// Protect: only Super Admin can trigger
const SUPER_ADMIN = 'support@vestria.style';

function parseDescription(arr: unknown): { lead: string; body: string }[] {
  if (!Array.isArray(arr)) return [];
  return (arr as any[]).map((s) => {
    const str = String(s ?? '');
    const i = str.indexOf(':');
    if (i < 0) return { lead: str.trim(), body: '' };
    return { lead: str.slice(0, i).trim(), body: str.slice(i + 1).trim() };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const decoded = await verifyBearerIdToken(req.headers.authorization as string | undefined);
    if (!decoded?.email || decoded.email.toLowerCase() !== SUPER_ADMIN) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const root = process.cwd();
    const recipesDir = path.join(root, 'public', 'recipes');
    const indexPath = path.join(recipesDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      return res.status(500).json({ message: 'index.json not bundled. Ensure includeFiles is configured.' });
    }
    const indexRaw = fs.readFileSync(indexPath, 'utf-8');
    const slugs: string[] = JSON.parse(indexRaw);
    if (!Array.isArray(slugs)) return res.status(400).json({ message: 'Invalid index.json' });

    const sb = getSupabaseAdmin();
    let ok = 0, fail = 0;
    for (const slug of slugs) {
      try {
        const metaPath = path.join(recipesDir, slug, 'meta.json');
        if (!fs.existsSync(metaPath)) throw new Error('Missing meta.json');
        const metaRaw = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(metaRaw);
        const row = {
          slug: String(meta.slug || slug),
          date: String(meta.date),
          title: String(meta.title),
          founder_id: String(meta.founderId || ''),
          description: parseDescription(meta.description),
          flatlay_url: `/recipes/${slug}/flatlay.webp`,
          model_url: `/recipes/${slug}/model.webp`,
          flatlay_alt: String(meta.flatlayAlt || `Flat lay of ${meta.title} outfit`),
          model_alt: String(meta.modelAlt || `Model wearing the ${meta.title} outfit styled from the flat lay`),
          created_by: 'seed-api',
        } as any;
        const { error } = await sb.from('recipes').upsert(row, { onConflict: 'slug' });
        if (error) throw error;
        ok++;
      } catch (e: any) {
        console.error('[recipes-seed] failed', slug, e?.message || e);
        fail++;
      }
    }
    return res.status(200).json({ ok, fail });
  } catch (e: any) {
    console.error('[recipes-seed] error', e);
    return res.status(500).json({ message: e?.message || 'Seed failed' });
  }
}

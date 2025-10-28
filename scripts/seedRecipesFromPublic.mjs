#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const recipesDir = path.resolve(__dirname, '..', 'public', 'recipes');
const indexPath = path.join(recipesDir, 'index.json');

function parseDescription(descArr) {
  if (!Array.isArray(descArr)) return [];
  return descArr.map((s) => {
    const str = String(s || '');
    const idx = str.indexOf(':');
    if (idx === -1) return { lead: str.trim(), body: '' };
    const lead = str.slice(0, idx).trim();
    const body = str.slice(idx + 1).trim();
    return { lead, body };
  });
}

async function main() {
  const raw = fs.readFileSync(indexPath, 'utf-8');
  const slugs = JSON.parse(raw);
  if (!Array.isArray(slugs)) {
    console.error('Invalid recipes/index.json');
    process.exit(1);
  }
  let ok = 0, fail = 0;
  for (const slug of slugs) {
    try {
      const metaPath = path.join(recipesDir, slug, 'meta.json');
      const metaRaw = fs.readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(metaRaw);
      const date = meta.date;
      const title = meta.title;
      const founder_id = meta.founderId;
      const description = parseDescription(meta.description);
      const flatlay_url = `/recipes/${slug}/flatlay.webp`;
      const model_url = `/recipes/${slug}/model.webp`;
      const flatlay_alt = meta.flatlayAlt || `Flat lay of ${title} outfit`;
      const model_alt = meta.modelAlt || `Model wearing the ${title} outfit styled from the flat lay`;
      const row = { slug, date, title, founder_id, description, flatlay_url, model_url, flatlay_alt, model_alt, created_by: 'seed-script' };
      const { error } = await sb.from('recipes').upsert(row, { onConflict: 'slug' });
      if (error) throw error;
      console.log(`Seeded: ${slug}`);
      ok++;
    } catch (e) {
      console.error(`Failed to seed ${slug}:`, e.message || e);
      fail++;
    }
  }
  console.log(`Done. OK=${ok}, Fail=${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

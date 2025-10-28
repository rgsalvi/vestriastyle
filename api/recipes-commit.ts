import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { getSupabaseAdmin, publicFrom } from './_lib/supabaseAdmin';
import { getFirebaseAdmin, verifyBearerIdToken } from './_lib/firebaseAdmin';

const ALLOWED_EMAILS = new Set(['t@vestria.style','m@vestria.style','r@vestria.style','support@vestria.style']);
const SUPER_ADMIN = 'support@vestria.style';
const BUCKET = 'recipes';

type CommitPayload = {
  title: string;
  founderId?: 'tanvi'|'muskaan'|'riddhi';
  dateIso?: string; // server will enforce for stylists; super admin may override
  description: { lead: string; body: string }[];
  flatlayDataUrl: string;
  modelDataUrl: string;
  flatlayAlt?: string;
  modelAlt?: string;
};

function toKebab(s: string) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const m = /^data:(.*?);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error('Invalid data URL');
  const mime = m[1];
  const b64 = m[2];
  const buffer = Buffer.from(b64, 'base64');
  return { mime, buffer };
}

function dateToIst(d: Date) {
  // IST is UTC+5:30
  return new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
}

function nextFridayIst(fromUtc = new Date()): Date {
  const ist = dateToIst(fromUtc);
  const day = ist.getUTCDay(); // using UTC getters on shifted date yields IST weekday
  const delta = (5 - day + 7) % 7 || 7; // 5=Friday; if today Friday, go to next Friday
  const next = new Date(ist.getTime() + delta * 24 * 60 * 60 * 1000);
  // set to midnight IST
  next.setUTCHours(0,0,0,0);
  // convert back by subtracting offset
  return new Date(next.getTime() - (5.5 * 60 * 60 * 1000));
}

async function ensureUniqueDate(sb: any, dateIso: string) {
  const { data, error } = await sb.from('recipes').select('id').eq('date', dateIso).limit(1);
  if (error) throw error;
  if (data && data.length) throw new Error('A recipe already exists for this Friday.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const decoded = await verifyBearerIdToken(req.headers.authorization as string | undefined);
    if (!decoded?.email || !ALLOWED_EMAILS.has(decoded.email)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const email = decoded.email as string;
    const isSuper = email === SUPER_ADMIN;

    const body = req.body as CommitPayload;
    if (!body?.title || !Array.isArray(body.description) || body.description.length === 0) {
      return res.status(400).json({ message: 'Missing title or description' });
    }
    if (!body.flatlayDataUrl || !body.modelDataUrl) {
      return res.status(400).json({ message: 'Missing images' });
    }
    // Enforce 10MB max per image
    const approxLen = (s: string) => Math.ceil((s.length * 3) / 4); // rough bytes for base64
    if (approxLen(body.flatlayDataUrl) > 10 * 1024 * 1024 || approxLen(body.modelDataUrl) > 10 * 1024 * 1024) {
      return res.status(413).json({ message: 'Images must be <= 10 MB each' });
    }

    // Founder rules
    let founderId: 'tanvi'|'muskaan'|'riddhi' | undefined = body.founderId;
    if (!isSuper) {
      founderId = email.startsWith('t@') ? 'tanvi' : email.startsWith('m@') ? 'muskaan' : email.startsWith('r@') ? 'riddhi' : undefined;
    }
    if (!founderId) return res.status(400).json({ message: 'Founder not specified' });

    // Date rules (IST Friday)
    const sb = getSupabaseAdmin();
    let dateIso = body.dateIso;
    if (!isSuper || !dateIso) {
      // Compute next available Friday
      let d = nextFridayIst();
      const toIso = (dt: Date) => dt.toISOString().slice(0,10);
      dateIso = toIso(d);
      // Ensure it is unique; if not, advance by 7 days until unique
      for (let i=0;i<26;i++) { // limit safety
        const { data: existing, error } = await sb.from('recipes').select('id').eq('date', dateIso).limit(1);
        if (error) throw error;
        if (!existing || existing.length === 0) break;
        d = new Date(d.getTime() + 7*24*60*60*1000);
        dateIso = toIso(d);
      }
      await ensureUniqueDate(sb, dateIso);
    } else {
      // Super admin provided date must be a Friday in IST and unused
      const d = new Date(`${dateIso}T00:00:00Z`);
      const ist = dateToIst(d);
      const weekday = ist.getUTCDay();
      if (weekday !== 5) return res.status(400).json({ message: 'Date must be a Friday (IST)' });
      await ensureUniqueDate(sb, dateIso);
    }

    // Slug from date + title
    const slug = `${dateIso}-${toKebab(body.title)}`;

    // Convert images to webp
    const { buffer: flatBuf } = parseDataUrl(body.flatlayDataUrl);
    const { buffer: modelBuf } = parseDataUrl(body.modelDataUrl);
    const flatWebp = await sharp(flatBuf).webp({ quality: 86 }).toBuffer();
    const modelWebp = await sharp(modelBuf).webp({ quality: 86 }).toBuffer();

    // Upload to storage
    const client = getSupabaseAdmin();
    const flatPath = `${slug}/flatlay.webp`;
    const modelPath = `${slug}/model.webp`;
    const up1 = await client.storage.from(BUCKET).upload(flatPath, flatWebp, { contentType: 'image/webp', upsert: true });
    if (up1.error) throw up1.error;
    const up2 = await client.storage.from(BUCKET).upload(modelPath, modelWebp, { contentType: 'image/webp', upsert: true });
    if (up2.error) throw up2.error;
    const flatlayUrl = publicFrom(`${BUCKET}/${flatPath}`);
    const modelUrl = publicFrom(`${BUCKET}/${modelPath}`);

    const desc = body.description.map(d => ({ lead: String(d.lead||'').trim(), body: String(d.body||'').trim() }));

    const flatlayAlt = body.flatlayAlt || `Flat lay of ${body.title} outfit`;
    const modelAlt = body.modelAlt || `Model wearing the ${body.title} outfit styled from the flat lay`;

    // Insert row
    const { error: insErr } = await client.from('recipes').insert({
      slug,
      date: dateIso,
      title: body.title,
      founder_id: founderId,
      description: desc,
      flatlay_url: flatlayUrl,
      model_url: modelUrl,
      flatlay_alt: flatlayAlt,
      model_alt: modelAlt,
      created_by: email,
    });
    if (insErr) throw insErr;

    // success
    return res.status(200).json({ slug, date: dateIso, flatlayUrl, modelUrl });
  } catch (e: any) {
    console.error('[recipes-commit] error', e);
    return res.status(500).json({ message: e?.message || 'Failed to publish recipe' });
  }
}

import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL as string | undefined;
  const key = process.env.SUPABASE_SERVICE_KEY as string | undefined;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function publicFrom(path: string): string {
  const url = process.env.SUPABASE_URL as string | undefined;
  if (!url) throw new Error('Missing SUPABASE_URL');
  return `${url}/storage/v1/object/public/${path}`;
}

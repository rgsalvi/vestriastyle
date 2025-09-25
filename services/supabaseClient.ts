import { createClient } from '@supabase/supabase-js';

// Environment variables expected:
// VITE_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY
// (Later for service role on server routes: SUPABASE_SERVICE_KEY)

let supabase: any | null = null;

export function getSupabaseClient(): any {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  supabase = createClient(url, key, {
    auth: {
      persistSession: false // we still rely on Firebase Auth for the moment
    }
  });
  return supabase;
}

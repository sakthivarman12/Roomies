/**
 * Placeholder Supabase client factory. Intentionally has NO dependency on @supabase/supabase-js yet,
 * so the app builds and runs without credentials. Install `@supabase/supabase-js` and replace the body later.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

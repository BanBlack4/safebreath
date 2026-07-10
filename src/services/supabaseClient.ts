import { createClient } from '@supabase/supabase-js';

const getEnvValue = (key: string) => {
  const viteEnv = typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return viteEnv?.[key] || process.env[key] || '';
};

const rawUrl = getEnvValue('VITE_SUPABASE_URL') || getEnvValue('SUPABASE_URL') || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY') || getEnvValue('SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Error: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export const getActiveSupabaseSession = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    return null;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.id) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out failures here.
    }
    return null;
  }

  return session;
};
import { createClient } from '@supabase/supabase-js';

const getEnvValue = (key: string) => {
  const viteEnv = typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return viteEnv?.[key] || process.env[key] || '';
};

const rawUrl = getEnvValue('VITE_SUPABASE_URL') || getEnvValue('SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY') || getEnvValue('SUPABASE_ANON_KEY') || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
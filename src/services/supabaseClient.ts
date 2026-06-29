import { createClient } from '@supabase/supabase-js';

// Esto es lo único que vale la pena salvar de tu código anterior (la limpieza de la URL)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, ''); 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)");
}

// Supabase ya gestiona el token automáticamente. 
// No necesitas inyectar headers manualmente nunca más.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
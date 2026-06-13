import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log('URL Configure:', !!process.env.VITE_SUPABASE_URL);
  
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
     console.log('Missing credentials in environment variables.');
     return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('health_events').select('*').limit(1);
  
  if (error) {
    console.error('Connection Error:', error);
  } else {
    console.log('Connection Successful. Rows:', data?.length);
  }
}

testConnection();

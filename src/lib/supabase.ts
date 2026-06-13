import { createClient } from '@supabase/supabase-js';
import { auth } from '../firebase';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, ''); // Remove trailing /rest/v1/ if the user added it by mistake
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options: RequestInit = {}) => {
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          options.headers = headers;
        } catch (err) {
          console.error("Error getting Firebase token:", err);
        }
      }
      return fetch(url, options);
    }
  }
});


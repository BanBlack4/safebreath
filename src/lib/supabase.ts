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
          
          // Construct a plain JavaScript object for headers to prevent any issues where
          // internal libraries clone, spread, or manipulate headers (which fails with Headers objects).
          const headersObj: Record<string, string> = {};
          
          if (options.headers) {
            if (options.headers instanceof Headers) {
              options.headers.forEach((value, key) => {
                headersObj[key] = value;
              });
            } else if (Array.isArray(options.headers)) {
              options.headers.forEach(([key, value]) => {
                headersObj[key] = value;
              });
            } else {
              Object.assign(headersObj, options.headers);
            }
          }
          
          // Overwrite the Authorization header with Firebase's JWT (and also preserve the apiKey copy)
          headersObj['Authorization'] = `Bearer ${token}`;
          // Explicitly ensure the apikey is present
          if (!headersObj['apikey'] && !headersObj['apiKey']) {
            headersObj['apikey'] = supabaseAnonKey;
          }
          
          options.headers = headersObj;
        } catch (err) {
          console.error("Error getting Firebase token:", err);
        }
      } else {
        console.warn("No authenticated Firebase user found during Supabase request!");
      }
      return fetch(url, options);
    }
  }
});


// client.ts — anon for browser
import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

export const supabaseBrowser = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

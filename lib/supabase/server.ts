// server.ts — admin/service role for Netlify functions only
import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

export const supabaseAdmin = createClient(
  env.SUPABASE_URL, 
  env.SUPABASE_SERVICE_ROLE_KEY, 
  { 
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);

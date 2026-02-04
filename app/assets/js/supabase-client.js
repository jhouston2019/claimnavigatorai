/**
 * Supabase Client
 * Phase 17 - Auth + Account Layer
 */

// Environment-safe configuration
// These will be replaced by build process or environment variables
// For local development, set these in window object or use environment variables
const SUPABASE_URL = window.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key';

// Dynamic import for Supabase
let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    // Use CDN import for browser compatibility
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  } catch (error) {
    console.error('CNError (Supabase Init):', error);
    // Fallback: return a mock client for development
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: null }),
        updateUser: () => Promise.resolve({ data: null, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, unsubscribe: () => {} })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
      })
    };
  }
}

// Export for use in other modules
window.getSupabaseClient = getSupabaseClient;

// Initialize on load
getSupabaseClient().then(client => {
  window.supabase = client;
});

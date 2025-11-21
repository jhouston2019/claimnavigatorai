/**
 * Unified Supabase Client for ClaimNavigatorAI
 * Provides singleton Supabase client instance
 */

let supabaseClient = null;

/**
 * Initialize Supabase client
 * Uses environment variables injected by Netlify or hardcoded for development
 */
export async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Try to get from window (injected by Netlify)
  const supabaseUrl = window.__SUPABASE_URL || '{{ SUPABASE_URL }}';
  const supabaseAnonKey = window.__SUPABASE_ANON_KEY || '{{ SUPABASE_ANON_KEY }}';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('{{') || supabaseAnonKey.includes('{{')) {
    console.warn('Supabase not configured. Loading from CDN...');
    
    // Load Supabase from CDN if not already loaded
    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
        script.type = 'module';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Use createClient from CDN
    const { createClient } = window.supabase || await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Use ES module import if available
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('Failed to load Supabase:', error);
      throw new Error('Supabase client initialization failed');
    }
  }

  return supabaseClient;
}

/**
 * Get current session
 */
export async function getSession() {
  const client = await getSupabaseClient();
  const { data: { session }, error } = await client.auth.getSession();
  if (error) {
    console.error('Session error:', error);
    return null;
  }
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export default getSupabaseClient;


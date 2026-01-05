/**
 * Unified Authentication Module for Claim Navigator
 * Handles login, register, logout, and auth checks
 */

import { getSupabaseClient, getSession, getCurrentUser } from './supabase-client.js';

/**
 * Check if user is authenticated
 * @returns {Promise<{authenticated: boolean, user: object|null, error: string|null}>}
 */
export async function checkAuthentication() {
  try {
    const client = await getSupabaseClient();
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error);
      return { authenticated: false, user: null, error: error.message };
    }

    return {
      authenticated: !!session,
      user: session?.user || null,
      session: session
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { authenticated: false, user: null, error: error.message };
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * @param {string} redirectTo - Optional redirect path after login
 * @returns {Promise<{authenticated: boolean, user: object|null}>}
 */
export async function requireAuth(redirectTo = null) {
  const auth = await checkAuthentication();
  
  if (!auth.authenticated) {
    const currentPath = window.location.pathname;
    const loginUrl = `/app/login.html${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : `?redirect=${encodeURIComponent(currentPath)}`}`;
    window.location.href = loginUrl;
    return { authenticated: false, user: null };
  }

  return auth;
}

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user: object|null, error: string|null}>}
 */
export async function login(email, password) {
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, user: null, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, user: null, error: error.message };
  }
}

/**
 * Register new user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user: object|null, error: string|null}>}
 */
export async function register(email, password) {
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard.html`
      }
    });

    if (error) {
      return { success: false, user: null, error: error.message };
    }

    // Profile will be created automatically by trigger
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, user: null, error: error.message };
  }
}

/**
 * Logout current user
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function logout() {
  try {
    const client = await getSupabaseClient();
    const { error } = await client.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    // Redirect to home
    window.location.href = '/';
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get auth token for API calls
 * @returns {Promise<string|null>}
 */
export async function getAuthToken() {
  const session = await getSession();
  return session?.access_token || null;
}

/**
 * Check if user has paid access
 * @returns {Promise<{hasAccess: boolean, paymentStatus: string|null}>}
 */
export async function checkPaymentStatus() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { hasAccess: false, paymentStatus: null };
    }

    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (error || !data) {
      return { hasAccess: false, paymentStatus: null };
    }

    return { hasAccess: true, paymentStatus: data.status };
  } catch (error) {
    console.error('Payment check error:', error);
    return { hasAccess: false, paymentStatus: null };
  }
}

// Export all functions
export {
  getSupabaseClient,
  getSession,
  getCurrentUser
};




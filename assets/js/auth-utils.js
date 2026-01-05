// Authentication utilities for Claim Navigator
// This file provides shared authentication functionality across the app

let supabase = null;
const isDevelopment = false; // Force production mode for live site

// Initialize Supabase client
async function initializeSupabase() {
  if (isDevelopment) {
    console.log('Development mode: Supabase not initialized');
    return null;
  }

  if (supabase) {
    return supabase;
  }

  try {
    // Load Supabase dynamically
    if (!window.supabase) {
      await loadSupabaseScript();
    }

    supabase = window.supabase.createClient(
      '{{ SUPABASE_URL }}',
      '{{ SUPABASE_ANON_KEY }}'
    );

    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return null;
  }
}

// Load Supabase script dynamically
function loadSupabaseScript() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/main/index.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Supabase script'));
    document.head.appendChild(script);
  });
}

// Check if user is authenticated
async function checkAuthentication() {
  if (isDevelopment) {
    // In development, assume user is authenticated
    return { authenticated: true, user: { id: 'dev-user-id', email: 'dev@example.com' } };
  }

  const client = await initializeSupabase();
  if (!client) {
    return { authenticated: false, error: 'Failed to initialize Supabase' };
  }

  try {
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('Auth error:', error);
      return { authenticated: false, error: error.message };
    }

    return {
      authenticated: !!session,
      user: session?.user || null,
      session: session
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { authenticated: false, error: error.message };
  }
}

// Require authentication - redirect to login if not authenticated
async function requireAuth() {
  const auth = await checkAuthentication();
  
  if (!auth.authenticated) {
    // Store the current URL to redirect back after login
    const currentUrl = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    
    // Redirect to login
    window.location.href = '/app/login.html';
    return false;
  }

  return true;
}

// Get auth headers for API calls
async function getAuthHeaders() {
  if (isDevelopment) {
    return {
      'Authorization': 'Bearer dev-token',
      'Content-Type': 'application/json'
    };
  }

  const client = await initializeSupabase();
  if (!client) {
    throw new Error('Supabase not initialized');
  }

  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

// Logout user
async function logout() {
  if (isDevelopment) {
    console.log('Development mode: Mock logout');
    window.location.href = '/app/login.html';
    return;
  }

  const client = await initializeSupabase();
  if (client) {
    await client.auth.signOut();
  }
  
  window.location.href = '/app/login.html';
}

// Make authenticated API call
async function authenticatedFetch(url, options = {}) {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    await logout();
    return null;
  }

  return response;
}

// Initialize app with authentication check
async function initializeApp() {
  const auth = await checkAuthentication();
  
  if (!auth.authenticated) {
    console.log('User not authenticated, redirecting to login');
    window.location.href = '/app/login.html';
    return false;
  }

  console.log('User authenticated:', auth.user?.email);
  return true;
}

// Export functions for use in other scripts
window.AuthUtils = {
  initializeSupabase,
  checkAuthentication,
  requireAuth,
  getAuthHeaders,
  logout,
  authenticatedFetch,
  initializeApp,
  isDevelopment
};

/**
 * Admin Authentication Utility
 * Role-based access control for admin console
 */

/**
 * Check if user is authenticated as admin
 * @returns {Promise<{authenticated: boolean, role?: string, user?: object}>}
 */
export async function requireAdminAuth() {
  try {
    // Get auth token
    const token = getAuthToken();
    if (!token) {
      redirectToAccessDenied();
      return { authenticated: false };
    }

    // Check admin status via API
    const response = await fetch('/.netlify/functions/admin/ai-console/check-admin', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      redirectToAccessDenied();
      return { authenticated: false };
    }

    const data = await response.json();
    if (!data.success || !data.data.isAdmin) {
      redirectToAccessDenied();
      return { authenticated: false };
    }

    return {
      authenticated: true,
      role: data.data.role,
      user: data.data.user
    };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    redirectToAccessDenied();
    return { authenticated: false };
  }
}

/**
 * Check if user is superadmin
 * @returns {Promise<boolean>}
 */
export async function isSuperAdmin() {
  const auth = await requireAdminAuth();
  return auth.authenticated && auth.role === 'superadmin';
}

/**
 * Get admin role
 * @returns {Promise<string|null>}
 */
export async function getAdminRole() {
  const auth = await requireAdminAuth();
  return auth.role || null;
}

/**
 * Get auth token from storage
 * @returns {string|null}
 */
function getAuthToken() {
  // Try Supabase session
  if (typeof window !== 'undefined' && window.supabase) {
    const session = window.supabase.auth.session();
    if (session?.access_token) {
      return session.access_token;
    }
  }

  // Try localStorage
  const stored = localStorage.getItem('supabase.auth.token');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.access_token || null;
    } catch (e) {
      // Ignore
    }
  }

  // Try sessionStorage
  const sessionToken = sessionStorage.getItem('supabase.auth.token');
  if (sessionToken) {
    try {
      const parsed = JSON.parse(sessionToken);
      return parsed.access_token || null;
    } catch (e) {
      // Ignore
    }
  }

  return null;
}

/**
 * Redirect to access denied page
 */
function redirectToAccessDenied() {
  if (typeof window !== 'undefined') {
    window.location.href = '/app/settings/access-denied.html';
  }
}



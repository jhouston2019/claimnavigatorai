/**
 * Paywall Enforcement - HARDENED
 * FAIL CLOSED: All errors block access
 */

window.checkPaywall = async function() {
  try {
    const user = await window.CNAuth?.currentUser();
    if (!user) {
      // Not authenticated - block access
      console.warn('CN Access Denied: No authenticated user');
      logAccessAttempt('no_auth', window.location.pathname);
      window.location.href = '/app/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }

    const supabase = await window.getSupabaseClient();
    if (!supabase) {
      console.error('CN Access Denied: Supabase client unavailable');
      logAccessAttempt('no_client', window.location.pathname, user.id);
      window.location.href = '/app/access-denied.html';
      return false;
    }

    const { data: claims, error } = await supabase
      .from('claims')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('CN Access Denied: Database error', error);
      logAccessAttempt('db_error', window.location.pathname, user.id);
      // FAIL CLOSED: On error, deny access
      window.location.href = '/app/access-denied.html';
      return false;
    }

    // If no active claim, redirect to paywall
    if (!claims || claims.length === 0) {
      console.warn('CN Access Denied: No active claim for user', user.id);
      logAccessAttempt('no_active_claim', window.location.pathname, user.id);
      
      const currentPath = window.location.pathname;
      // Don't redirect if already on paywall or auth pages
      if (!currentPath.includes('/paywall/') && 
          !currentPath.includes('/auth/') && 
          !currentPath.includes('/marketing/') &&
          !currentPath.includes('/access-denied') &&
          !currentPath.includes('/claim/success')) {
        window.location.href = '/paywall/locked.html';
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('CN Access Denied: Exception', error);
    logAccessAttempt('exception', window.location.pathname);
    // FAIL CLOSED: On exception, deny access
    window.location.href = '/app/access-denied.html';
    return false;
  }
};

/**
 * Log unauthorized access attempts (minimal logging)
 */
function logAccessAttempt(reason, path, userId = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    reason: reason,
    path: path,
    userId: userId || 'anonymous'
  };
  
  // Store in sessionStorage for debugging (non-persistent)
  try {
    const logs = JSON.parse(sessionStorage.getItem('cn_access_logs') || '[]');
    logs.push(logEntry);
    // Keep only last 10 entries
    if (logs.length > 10) logs.shift();
    sessionStorage.setItem('cn_access_logs', JSON.stringify(logs));
  } catch (e) {
    // Silent fail on logging errors
  }
  
  console.warn('CN Access Attempt:', logEntry);
}

/**
 * Enforce paywall with blocking guard
 * Returns promise that resolves to true only if access is granted
 */
window.enforcePaywall = async function() {
  const hasAccess = await window.checkPaywall();
  if (!hasAccess) {
    // Block page rendering
    document.body.style.display = 'none';
    throw new Error('Access denied');
  }
  return true;
};

// Auto-check on pages that require it
if (window.CNAuth) {
  window.CNAuth.onAuthStateChanged(async (user) => {
    if (!user) {
      // No user - block immediately
      console.warn('CN Access Denied: Auth state changed to no user');
      logAccessAttempt('auth_state_no_user', window.location.pathname);
      window.location.href = '/app/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
  });
}


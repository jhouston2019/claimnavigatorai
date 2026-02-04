/**
 * REUSABLE ACCESS GUARD
 * Blocks page rendering until access is verified
 * FAIL CLOSED: All errors block access
 * 
 * Usage: Include this script in <head> before any content loads
 * <script src="/app/assets/js/access-guard.js"></script>
 */

(function() {
  'use strict';
  
  // Block rendering immediately
  document.documentElement.style.visibility = 'hidden';
  document.documentElement.style.opacity = '0';
  
  /**
   * Log access attempt
   */
  function logAccessAttempt(reason, userId = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      reason: reason,
      path: window.location.pathname,
      userId: userId || 'anonymous'
    };
    
    try {
      const logs = JSON.parse(sessionStorage.getItem('cn_access_logs') || '[]');
      logs.push(logEntry);
      if (logs.length > 10) logs.shift();
      sessionStorage.setItem('cn_access_logs', JSON.stringify(logs));
    } catch (e) {
      // Silent fail
    }
    
    console.warn('CN Access Attempt:', logEntry);
  }
  
  /**
   * Wait for dependency to load
   */
  async function waitForDependency(checkFn, maxAttempts = 50, interval = 100) {
    let attempts = 0;
    while (!checkFn() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    return checkFn();
  }
  
  /**
   * Enforce access control
   */
  async function enforceAccess() {
    try {
      // Wait for auth system
      const hasAuth = await waitForDependency(() => window.CNAuth);
      if (!hasAuth) {
        console.error('CN Access Denied: Auth system failed to load');
        logAccessAttempt('auth_load_failed');
        window.location.href = '/app/access-denied.html';
        return;
      }
      
      // Check authentication
      const user = await window.CNAuth.currentUser();
      if (!user) {
        console.warn('CN Access Denied: No authenticated user');
        logAccessAttempt('no_auth');
        window.location.href = '/app/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      // Wait for Supabase client
      const hasSupabase = await waitForDependency(() => window.getSupabaseClient);
      if (!hasSupabase) {
        console.error('CN Access Denied: Supabase failed to load');
        logAccessAttempt('supabase_load_failed', user.id);
        window.location.href = '/app/access-denied.html';
        return;
      }
      
      const supabase = await window.getSupabaseClient();
      if (!supabase) {
        console.error('CN Access Denied: Supabase client unavailable');
        logAccessAttempt('no_supabase_client', user.id);
        window.location.href = '/app/access-denied.html';
        return;
      }
      
      // Check for active claim
      const { data: claims, error } = await supabase
        .from('claims')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);
      
      if (error) {
        console.error('CN Access Denied: Database error', error);
        logAccessAttempt('db_error', user.id);
        window.location.href = '/app/access-denied.html';
        return;
      }
      
      if (!claims || claims.length === 0) {
        console.warn('CN Access Denied: No active claim');
        logAccessAttempt('no_active_claim', user.id);
        window.location.href = '/paywall/locked.html';
        return;
      }
      
      // Access granted - show page
      console.log('CN Access Granted:', user.id);
      document.documentElement.style.visibility = 'visible';
      document.documentElement.style.opacity = '1';
      
      // Store access grant for session
      sessionStorage.setItem('cn_access_granted', Date.now().toString());
      
    } catch (error) {
      console.error('CN Access Denied: Exception', error);
      logAccessAttempt('exception');
      window.location.href = '/app/access-denied.html';
    }
  }
  
  // Execute access control on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceAccess);
  } else {
    enforceAccess();
  }
  
})();




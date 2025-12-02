/**
 * Auth Session Management
 * Phase 17 - Auth + Account Layer
 */

(function() {
  let currentUser = null;
  let authListeners = [];
  let authStateSubscription = null;

  async function initAuth() {
    try {
      const supabase = await window.getSupabaseClient();
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        notifyListeners(currentUser);
      }

      // Listen for auth state changes
      authStateSubscription = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          currentUser = session.user;
        } else {
          currentUser = null;
        }
        notifyListeners(currentUser);
      });
    } catch (error) {
      console.error('CNError (Auth Init):', error);
      currentUser = null;
    }
  }

  function notifyListeners(user) {
    authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (err) {
        console.error('CNError (Auth Listener):', err);
      }
    });
  }

  async function currentUser() {
    if (!currentUser) {
      try {
        const supabase = await window.getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          currentUser = session.user;
        }
      } catch (error) {
        console.error('CNError (Get Current User):', error);
      }
    }
    return currentUser;
  }

  async function requireAuth(redirectToLogin = false) {
    const user = await currentUser();
    if (!user) {
      if (redirectToLogin) {
        const currentPath = window.location.pathname;
        window.location.href = `/auth/login.html?redirect=${encodeURIComponent(currentPath)}`;
      }
      return false;
    }
    return true;
  }

  async function logout() {
    try {
      const supabase = await window.getSupabaseClient();
      await supabase.auth.signOut();
      currentUser = null;
      
      // Redirect to marketing site
      window.location.href = '/marketing/index.html';
    } catch (error) {
      console.error('CNError (Logout):', error);
      if (window.CNToast) {
        window.CNToast.error('Failed to logout. Please try again.');
      }
    }
  }

  function onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      authListeners.push(callback);
      // Immediately call with current state
      currentUser().then(user => callback(user));
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  // Expose API
  window.CNAuth = {
    currentUser,
    requireAuth,
    logout,
    onAuthStateChanged
  };
})();


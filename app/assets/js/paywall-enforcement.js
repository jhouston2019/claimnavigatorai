/**
 * Paywall Enforcement
 * Phase B - Check for active claim and redirect if needed
 */

window.checkPaywall = async function() {
  try {
    const user = await window.CNAuth?.currentUser();
    if (!user) {
      // Not authenticated - auth will handle redirect
      return true;
    }

    const supabase = await window.getSupabaseClient();
    const { data: claims, error } = await supabase
      .from('claims')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('CNError (Paywall Check):', error);
      // On error, allow access (fail open for development)
      return true;
    }

    // If no active claim, redirect to paywall
    if (!claims || claims.length === 0) {
      const currentPath = window.location.pathname;
      // Don't redirect if already on paywall or auth pages
      if (!currentPath.includes('/paywall/') && 
          !currentPath.includes('/auth/') && 
          !currentPath.includes('/marketing/') &&
          !currentPath.includes('/claim/success')) {
        window.location.href = '/paywall/locked.html';
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('CNError (Paywall Check):', error);
    // Fail open for development
    return true;
  }
};

// Auto-check on pages that require it
if (window.CNAuth) {
  window.CNAuth.onAuthStateChanged(async (user) => {
    if (user) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        window.checkPaywall();
      }, 500);
    }
  });
}


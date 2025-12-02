/**
 * Stripe Checkout Integration
 * Phase 18 - Stripe Paywall + Claim Unlock System
 */

window.launchClaimCheckout = async function() {
  try {
    if (window.CNLoading) {
      window.CNLoading.show('Preparing checkout...');
    }

    // Get current user
    const user = await window.CNAuth?.currentUser();
    if (!user) {
      window.location.href = '/auth/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    // Call Netlify function to create checkout session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();

    if (url) {
      // Redirect to Stripe Checkout
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received');
    }

  } catch (error) {
    console.error('CNError (Stripe Checkout):', error);
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    if (window.CNToast) {
      window.CNToast.error('Failed to start checkout. Please try again.');
    }
  }
};


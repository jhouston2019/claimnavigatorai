/**
 * Claim Navigator Demo Mode Engine
 * Core switch for enabling/disabling demo mode across the application
 */

const DEMO_KEY = "cn_demo_mode";

function isDemoMode() {
  return localStorage.getItem(DEMO_KEY) === "1";
}

function enableDemoMode() {
  localStorage.setItem(DEMO_KEY, "1");
  
  // Log to analytics if available
  if (window.CNAnalytics) {
    CNAnalytics.log("demo_mode_enabled");
  }
}

function disableDemoMode() {
  localStorage.removeItem(DEMO_KEY);
  
  // Log to analytics if available
  if (window.CNAnalytics) {
    CNAnalytics.log("demo_mode_disabled");
  }
}

// Make functions globally accessible
window.CNDemo = {
  isDemoMode,
  enableDemoMode,
  disableDemoMode
};

// Check for demo parameter in URL
if (typeof URLSearchParams !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const demoParam = params.get("demo");
  if (demoParam === "1") {
    enableDemoMode();
  }
}


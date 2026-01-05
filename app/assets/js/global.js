/**
 * Claim Navigator Global Scripts
 * Attribution tracking, retention loops, and global behaviors
 */

// Funnel Entry Tags (Attribution Tracking)
(function() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("src");
  if (source) {
    localStorage.setItem("cn_attribution", source);
    if (window.CNAnalytics) {
      CNAnalytics.log("attribution_set", { source });
    }
  }
  
  // Screenshot mode
  const screenshot = params.get("screenshot");
  if (screenshot === "1") {
    document.body.classList.add("screenshot-mode");
  }
})();

// Retention Loop - Weekly Claim Snapshot
function sendWeeklySnapshot() {
  const last = localStorage.getItem("snapshotSent");
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  
  if (!last || now - parseInt(last) > WEEK) {
    const health = window.computeClaimHealth ? computeClaimHealth() : 0;
    const activation = window.getActivation ? getActivation() : {};
    
    if (window.CNAnalytics) {
      CNAnalytics.log("weekly_snapshot", {
        health,
        activationCount: Object.keys(activation).length,
        timestamp: now
      });
    }
    
    localStorage.setItem("snapshotSent", now.toString());
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  sendWeeklySnapshot();
  
  // Phase 8: Abandoned checkout recovery
  if (localStorage.getItem("checkout_abandoned") === "1" && 
      window.CNUserTier && CNUserTier.isFree() && 
      window.CNUpgrade) {
    setTimeout(() => {
      CNUpgrade.show("checkout_abandoned");
      localStorage.removeItem("checkout_abandoned");
    }, 2000);
  }
  
  // Phase 9: Update org badge in nav
  if (window.CNUserTier && CNUserTier.isEnterprise() && window.CNOrg) {
    const org = CNOrg.getOrg();
    const el = document.getElementById("nav-org-label");
    if (el) {
      if (org && org.name) {
        el.textContent = org.name;
      } else {
        el.textContent = "No Org";
      }
    }
  }
});

// Lowball/Denial Detection (for AI Response Agent)
function detectLowballOrDenial(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  const keywords = [
    "lowball",
    "denied",
    "denial",
    "rejected",
    "too low",
    "unfair offer",
    "insufficient",
    "not enough"
  ];
  
  return keywords.some(keyword => lowerText.includes(keyword));
}

// Make function globally accessible
window.detectLowballOrDenial = detectLowballOrDenial;


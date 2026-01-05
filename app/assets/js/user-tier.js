/**
 * Claim Navigator User Tier System
 * Central source of truth for user tier management
 */

const USER_TIER_KEY = "cn_user_tier";

function getUserTier() {
  // If backend is integrated later, it can write window.__CN_USER__
  if (window.__CN_USER__ && window.__CN_USER__.tier) {
    return window.__CN_USER__.tier; // "free" | "pro" | "enterprise"
  }
  return localStorage.getItem(USER_TIER_KEY) || "free";
}

function setUserTier(tier) {
  if (!["free", "pro", "enterprise"].includes(tier)) {
    console.warn("Invalid tier:", tier);
    return;
  }
  localStorage.setItem(USER_TIER_KEY, tier);
  
  // Log tier change to analytics
  if (window.CNAnalytics) {
    CNAnalytics.log("tier_changed", { tier });
  }
  
  // Update nav badge if present
  updateNavTierBadge();
}

function isFree() {
  return getUserTier() === "free";
}

function isPro() {
  const tier = getUserTier();
  return tier === "pro" || tier === "enterprise";
}

function isEnterprise() {
  return getUserTier() === "enterprise";
}

function hasAccess(requiredTier) {
  const tier = getUserTier();
  const tierRank = { free: 0, pro: 1, enterprise: 2 };
  const requiredRank = tierRank[requiredTier] || 0;
  return tierRank[tier] >= requiredRank;
}

function updateNavTierBadge() {
  const el = document.getElementById("nav-tier-label");
  if (!el) return;
  
  const tier = getUserTier();
  el.textContent = tier === "enterprise"
    ? "Enterprise"
    : tier === "pro"
    ? "Pro"
    : "Free";
  
  el.classList.remove("tier-pro", "tier-enterprise");
  if (tier === "pro") el.classList.add("tier-pro");
  if (tier === "enterprise") el.classList.add("tier-enterprise");
}

// Make functions globally accessible
window.CNUserTier = {
  getUserTier,
  setUserTier,
  isFree,
  isPro,
  isEnterprise,
  hasAccess,
  updateNavTierBadge
};

// Auto-update badge on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateNavTierBadge);
} else {
  updateNavTierBadge();
}


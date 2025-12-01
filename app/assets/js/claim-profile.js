/**
 * Claim Profile Module
 * Centralized claim and claimant data management
 * Phase 12A - Onboarding + Claim Profile
 */

const CLAIM_PROFILE_KEY = "cn_claim_profile";

function getClaimProfile() {
  try {
    return JSON.parse(localStorage.getItem(CLAIM_PROFILE_KEY) || "{}");
  } catch (e) {
    console.error("Error parsing claim profile:", e);
    return {};
  }
}

function saveClaimProfile(profile) {
  localStorage.setItem(CLAIM_PROFILE_KEY, JSON.stringify(profile));
  
  // Trigger real-time Claim Health recalculation
  if (window.CNHealthHooks) {
    window.CNHealthHooks.trigger();
  }
}

function updateClaimProfile(partial) {
  const current = getClaimProfile();
  const next = { ...current, ...partial };
  saveClaimProfile(next);
  return next;
}

function hasClaimProfile() {
  const profile = getClaimProfile();
  return !!(profile && profile.claim && profile.claim.lossDate && profile.claim.claimType);
}

window.CNClaimProfile = {
  getClaimProfile,
  saveClaimProfile,
  updateClaimProfile,
  hasClaimProfile
};


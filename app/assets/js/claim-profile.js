/**
 * Claim Profile Module
 * Centralized claim and claimant data management
 * Phase 12A - Onboarding + Claim Profile
 */

const CLAIM_PROFILE_KEY = "cn_claim_profile";

function getClaimProfile() {
  try {
    // Try storage-v2 first
    if (window.CNStorage) {
      const profile = window.CNStorage.getSection("profile");
      if (profile && Object.keys(profile).length > 0) {
        return profile;
      }
    }
    
    // Fallback to old localStorage
    const oldProfile = JSON.parse(localStorage.getItem(CLAIM_PROFILE_KEY) || "{}");
    if (oldProfile && Object.keys(oldProfile).length > 0) {
      // Migrate to storage-v2
      if (window.CNStorage) {
        window.CNStorage.setSection("profile", oldProfile);
      }
      return oldProfile;
    }
    
    return {};
  } catch (e) {
    console.error("CNError (Get Claim Profile):", e);
    return {};
  }
}

function saveClaimProfile(profile) {
  try {
    // Save to storage-v2
    if (window.CNStorage) {
      window.CNStorage.setSection("profile", profile);
    }
    
    // Also save to old key for backward compatibility
    localStorage.setItem(CLAIM_PROFILE_KEY, JSON.stringify(profile));
    
    // Log timeline event
    if (window.CNTimeline) {
      window.CNTimeline.log("claim_profile_update", {});
    }
    
    // Trigger real-time Claim Health recalculation
    if (window.CNHealthHooks) {
      window.CNHealthHooks.trigger();
    }
  } catch (e) {
    console.error("CNError (Save Claim Profile):", e);
    if (window.CNToast) {
      window.CNToast.error("Failed to save claim profile.");
    }
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

function getClaimStateCode(profile) {
  const p = profile || getClaimProfile();
  return (
    p?.property?.state ||
    p?.claimant?.state ||
    p?.claim?.state ||
    "DEFAULT"
  );
}

window.CNClaimProfile = {
  getClaimProfile,
  saveClaimProfile,
  updateClaimProfile,
  hasClaimProfile,
  getClaimStateCode
};


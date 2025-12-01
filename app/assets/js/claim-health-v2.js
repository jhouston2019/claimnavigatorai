/**
 * Claim Health Engine v2
 * Phase 14 - Real-time scoring with dynamic flags and risk analysis
 */

(function() {
  const HEALTH_KEY = "cn_claim_health_score";

  function computeClaimHealth() {
    const profile = window.CNClaimProfile ? CNClaimProfile.getClaimProfile() : {};
    const status = profile.status || {};
    const damage = profile.damage || {};
    const goals = profile.goals || [];

    let score = 100;
    let flags = [];

    // ---- BASIC COMPLETENESS ----
    if (!profile.claimant?.name) { 
      score -= 10; 
      flags.push("Missing claimant name."); 
    }
    if (!profile.claim?.claimType) { 
      score -= 10; 
      flags.push("Missing claim type."); 
    }
    if (!profile.claim?.lossDate) { 
      score -= 10; 
      flags.push("Missing date of loss."); 
    }
    if (!profile.claim?.carrier) { 
      score -= 10; 
      flags.push("Missing insurance carrier."); 
    }
    if (!damage.description) { 
      score -= 8; 
      flags.push("Missing incident description."); 
    }
    if (!damage.roomsAffected) { 
      score -= 6; 
      flags.push("Missing damage room summary."); 
    }

    // ---- STATUS RISK ----
    if (status.claimStatus === "denied") {
      score -= 20; 
      flags.push("Claim has been denied.");
    } else if (status.claimStatus === "lowball_offer") {
      score -= 15; 
      flags.push("Lowball offer received.");
    }

    // ---- EVIDENCE COMPLETENESS ----
    const photoCount = parseInt(localStorage.getItem("cn_evidence_photo_count") || "0", 10);
    if (photoCount === 0) {
      score -= 20;
      flags.push("No evidence photos uploaded.");
    } else if (photoCount < 5) {
      score -= 10;
      flags.push("Not enough evidence photos uploaded.");
    }

    // ---- DOCUMENT COMPLETENESS ----
    const docCount = parseInt(localStorage.getItem("cn_docs_generated") || "0", 10);
    if (docCount === 0) {
      score -= 15;
      flags.push("No claim documents generated.");
    }

    // ---- GOALS ALIGNMENT (INCREASES WEIGHTING) ----
    if (goals.includes("maximize_payout")) {
      score -= 0; // neutral
    }
    if (goals.includes("fight_lowball") && status.claimStatus !== "lowball_offer") {
      score -= 5;
      flags.push("Lowball-fighting goal set but no lowball detected.");
    }

    // ---- SCORE FLOOR & SAVE ----
    if (score < 0) score = 0;

    const health = { score, flags, timestamp: Date.now() };
    localStorage.setItem(HEALTH_KEY, JSON.stringify(health));
    return health;
  }

  function getHealth() {
    try {
      return JSON.parse(localStorage.getItem(HEALTH_KEY) || "{}");
    } catch {
      return {};
    }
  }

  window.CNHealth = {
    compute: computeClaimHealth,
    get: getHealth
  };
})();


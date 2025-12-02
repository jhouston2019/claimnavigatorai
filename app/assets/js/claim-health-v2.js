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

    // Get previous score to calculate delta
    const previousHealth = getHealth();
    const previousScore = previousHealth.score || 0;

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

    // Calculate category subscores
    const subscores = {
      documentation: 100 - (docCount === 0 ? 15 : 0),
      evidence: 100 - (photoCount === 0 ? 20 : photoCount < 5 ? 10 : 0),
      compliance: 100 - (status.claimStatus === "denied" ? 20 : 0),
      financials: 100, // placeholder until estimate integration
      negotiation: 100 - (status.claimStatus === "lowball_offer" ? 15 : 0),
      completeness: 100 - [
        !profile.claimant?.name,
        !profile.claim?.claimType,
        !profile.claim?.lossDate,
        !profile.claim?.carrier,
        !damage.description,
        !damage.roomsAffected
      ].filter(Boolean).length * 5
    };

    // State-aware deadline risk assessment
    let stateModule = null;
    if (window.CNStateModules && window.CNClaimProfile) {
      const stateCode = window.CNClaimProfile.getClaimStateCode(profile);
      stateModule = window.CNStateModules.get(stateCode);
      
      if (stateModule && profile.claim?.lossDate) {
        try {
          const loss = new Date(profile.claim.lossDate);
          const now = new Date();
          const diffDays = (now - loss) / (1000 * 60 * 60 * 24);
          const deadlines = stateModule.deadlines;
          
          // Check proof of loss timing
          if (diffDays > deadlines.proofOfLossDays) {
            // Check if proof of loss appears incomplete
            const hasProofOfLoss = docCount > 0 || profile.docs?.proofOfLossSubmitted;
            if (!hasProofOfLoss) {
              score = Math.max(0, score - 10);
              flags.push(
                `Proof of Loss timing risk: loss occurred more than ${deadlines.proofOfLossDays} days ago and proof of loss may be incomplete.`
              );
            }
          }
        } catch (e) {
          console.warn('CNError (State Deadline Check):', e);
        }
      }
    }

    // Calculate delta
    const delta = score - previousScore;

    const health = { 
      score, 
      flags, 
      subscores, 
      delta, 
      timestamp: Date.now(),
      stateName: stateModule ? stateModule.name : null
    };
    
    // Save to storage-v2
    if (window.CNStorage) {
      window.CNStorage.setSection("health", { lastScore: score, lastHealth: health });
    }
    
    // Also save to old key for backward compatibility
    localStorage.setItem(HEALTH_KEY, JSON.stringify(health));
    return health;
  }

  function getHealth() {
    try {
      // Try storage-v2 first
      if (window.CNStorage) {
        const healthData = window.CNStorage.getSection("health");
        if (healthData && healthData.lastHealth) {
          return healthData.lastHealth;
        }
      }
      
      // Fallback to old localStorage
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


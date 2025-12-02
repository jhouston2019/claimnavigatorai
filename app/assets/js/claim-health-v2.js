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

    // State-aware deadline risk assessment and compliance flags
    let stateModule = null;
    if (window.CNStateModules && window.CNClaimProfile) {
      const stateCode = window.CNClaimProfile.getClaimStateCode(profile);
      stateModule = window.CNStateModules.get(stateCode);
      
      // Generate compliance flags
      const complianceFlags = generateComplianceFlags(profile, stateModule, photoCount, docCount);
      complianceFlags.forEach(flag => {
        flags.push(flag.message);
        score = Math.max(0, score - flag.penalty);
      });
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

  /**
   * Generate Compliance Flags
   * Phase Finalization - Auto-flag violations and timing risks
   */
  function generateComplianceFlags(profile, stateModule, photoCount, docCount) {
    const complianceFlags = [];
    if (!stateModule) return complianceFlags;

    const deadlines = stateModule.deadlines;
    const status = profile.status || {};
    const damage = profile.damage || {};
    const timeline = window.CNTimeline ? JSON.parse(localStorage.getItem("cn_claim_timeline") || "[]") : [];

    try {
      // Check insurer acknowledgment timing
      const commEvents = timeline.filter(e => e.action === "insurer_communication" || e.action === "ai_response");
      if (commEvents.length > 0 && profile.claim?.lossDate) {
        const loss = new Date(profile.claim.lossDate);
        const firstComm = commEvents[0];
        const commDate = new Date(firstComm.ts || firstComm.meta?.date || loss);
        const daysToAck = (commDate - loss) / (1000 * 60 * 60 * 24);
        
        if (daysToAck > deadlines.insurerAckDays) {
          complianceFlags.push({
            message: `Insurer acknowledgment timing concern: communication logged ${Math.round(daysToAck)} days after loss, beyond typical ${deadlines.insurerAckDays}-day expectation.`,
            penalty: 5
          });
        }
      }

      // Check decision deadline
      if (profile.claim?.lossDate) {
        const loss = new Date(profile.claim.lossDate);
        const now = new Date();
        const diffDays = (now - loss) / (1000 * 60 * 60 * 24);
        
        if (diffDays > deadlines.insurerDecisionDays) {
          const hasClosure = status.claimStatus === "closed" || status.claimStatus === "settled";
          if (!hasClosure) {
            complianceFlags.push({
              message: `Decision deadline timing risk: loss occurred ${Math.round(diffDays)} days ago, beyond typical ${deadlines.insurerDecisionDays}-day decision expectation.`,
              penalty: 8
            });
          }
        }
      }

      // Check payment delay risk
      const settledEvents = timeline.filter(e => 
        e.action === "settlement_agreed" || 
        e.meta?.status === "settled" ||
        status.claimStatus === "settled"
      );
      const paymentEvents = timeline.filter(e => 
        e.action === "payment_received" || 
        e.meta?.payment === true
      );
      
      if (settledEvents.length > 0 && paymentEvents.length === 0) {
        const settledDate = new Date(settledEvents[0].ts || Date.now());
        const now = new Date();
        const daysSinceSettlement = (now - settledDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceSettlement > deadlines.paymentAfterAgreementDays) {
          complianceFlags.push({
            message: `Payment delay risk: settlement agreed ${Math.round(daysSinceSettlement)} days ago, beyond typical ${deadlines.paymentAfterAgreementDays}-day payment expectation.`,
            penalty: 7
          });
        }
      }

      // State-specific escalation suggestions
      if (stateModule.code === "FL" && (status.claimStatus === "lowball_offer" || status.claimStatus === "underpaid")) {
        complianceFlags.push({
          message: `Florida-specific escalation pathway: Consider DFS mediation if claim remains underpaid after negotiation.`,
          penalty: 0 // Informational only
        });
      }

      if (stateModule.code === "TX") {
        const hasDelays = timeline.some(e => {
          const eventDate = new Date(e.ts || Date.now());
          const loss = profile.claim?.lossDate ? new Date(profile.claim.lossDate) : null;
          if (!loss) return false;
          const daysSince = (eventDate - loss) / (1000 * 60 * 60 * 24);
          return daysSince > deadlines.insurerDecisionDays;
        });
        
        if (hasDelays) {
          complianceFlags.push({
            message: `Texas Prompt Payment expectations: Monitor insurer response times relative to Texas Prompt Payment of Claims statutes.`,
            penalty: 0 // Informational only
          });
        }
      }

      // Missing mandatory actions
      if (!damage.description) {
        complianceFlags.push({
          message: "Missing mandatory action: Incident description required.",
          penalty: 0 // Already penalized above
        });
      }

      if (photoCount === 0) {
        complianceFlags.push({
          message: "Missing mandatory action: Evidence photos required.",
          penalty: 0 // Already penalized above
        });
      }

      if (docCount === 0) {
        complianceFlags.push({
          message: "Missing mandatory action: Key documents not generated.",
          penalty: 0 // Already penalized above
        });
      }

      // Roadmap milestone check
      const roadmapState = JSON.parse(localStorage.getItem("claimRoadmapProgress") || "{}");
      const completedStages = roadmapState.completedStageIds || [];
      if (completedStages.length === 0) {
        complianceFlags.push({
          message: "Missing milestone: No roadmap stages completed.",
          penalty: 5
        });
      }

    } catch (e) {
      console.warn('CNError (Compliance Flags):', e);
    }

    return complianceFlags;
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


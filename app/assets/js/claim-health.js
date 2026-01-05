/**
 * Claim Navigator Claim Health Score Calculator
 * Dynamic scoring model based on user activation and engagement
 */

function computeClaimHealth() {
  const activation = getActivation ? getActivation() : JSON.parse(localStorage.getItem("cn_activation") || "{}");
  let score = 0;
  
  // Add 10 points for each completed stage
  for (let i = 1; i <= 6; i++) {
    if (activation[`stage_${i}_complete`]) score += 10;
  }
  
  // Evidence Organizer (15 points)
  if (activation["evidence_organizer_opened"]) score += 15;
  
  // First Document Generated (20 points)
  if (activation["first_doc_generated"]) score += 20;
  
  // AI Response Agent Used (10 points)
  if (activation["ai_agent_used"]) score += 10;
  
  // ROM Estimator Run (10 points)
  if (activation["rom_run"]) score += 10;
  
  // Negotiation Scripts Opened (10 points)
  if (activation["negotiation_script_opened"]) score += 10;
  
  // Compliance Engine Opened (15 points)
  if (activation["compliance_engine_opened"]) score += 15;
  
  // Claim Journal Entry Created (10 points)
  if (activation["claim_journal_entry"]) score += 10;
  
  // Bonus for completing 3 stages (5 points)
  if (activation["completed_3_stages"]) score += 5;
  
  // Bonus for full activation (10 points)
  if (activation["full_activation"]) score += 10;
  
  return Math.min(100, score);
}

function getClaimHealthLevel(score) {
  if (score >= 80) return { level: "Excellent", color: "#10b981" };
  if (score >= 60) return { level: "Good", color: "#3b82f6" };
  if (score >= 40) return { level: "Fair", color: "#f59e0b" };
  return { level: "Needs Improvement", color: "#ef4444" };
}

// Make function globally accessible
window.computeClaimHealth = computeClaimHealth;
window.getClaimHealthLevel = getClaimHealthLevel;


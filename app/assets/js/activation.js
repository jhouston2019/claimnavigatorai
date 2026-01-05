/**
 * Claim Navigator Activation Tracking System
 * Tracks 10 key activation milestones for user engagement
 */

const ACTIVATION_KEY = "cn_activation";

function getActivation() {
  return JSON.parse(localStorage.getItem(ACTIVATION_KEY) || "{}");
}

function saveActivation(obj) {
  localStorage.setItem(ACTIVATION_KEY, JSON.stringify(obj));
}

function markActivation(step) {
  const a = getActivation();
  if (!a[step]) {
    a[step] = Date.now();
    saveActivation(a);
    
    // Log to analytics
    if (window.CNAnalytics) {
      CNAnalytics.log("activation_step_completed", { step, timestamp: a[step] });
    }
    
    // Check for milestone achievements
    checkActivationMilestones();
  }
}

function checkActivationMilestones() {
  const a = getActivation();
  const milestones = [
    "stage_1_complete",
    "evidence_organizer_opened",
    "first_doc_generated",
    "ai_agent_used",
    "rom_run",
    "negotiation_script_opened",
    "compliance_engine_opened",
    "claim_journal_entry",
    "completed_3_stages",
    "full_activation"
  ];
  
  const completed = milestones.filter(m => a[m]);
  
  if (window.CNAnalytics) {
    CNAnalytics.log("activation_progress", { 
      completed: completed.length,
      total: milestones.length,
      milestones: completed
    });
  }
}

// Make functions globally accessible
window.markActivation = markActivation;
window.getActivation = getActivation;


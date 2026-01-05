/**
 * Claim Navigator Sample Claims Library
 * Pre-populated sample claims for demo purposes
 */

window.CNSampleClaims = {
  fire: {
    title: "Fire Loss – Kitchen",
    health: 82,
    completedStages: [1, 2, 3, 4],
    activation: {
      "stage_1_complete": Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
      "stage_2_complete": Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
      "stage_3_complete": Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
      "stage_4_complete": Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
      "first_doc_generated": Date.now() - (6 * 24 * 60 * 60 * 1000),
      "evidence_organizer_opened": Date.now() - (5 * 24 * 60 * 60 * 1000),
      "ai_agent_used": Date.now() - (2 * 24 * 60 * 60 * 1000),
      "rom_run": Date.now() - (3 * 24 * 60 * 60 * 1000)
    },
    roadmapState: {
      completedStageIds: [1, 2, 3, 4],
      currentStageId: 5
    }
  },
  water: {
    title: "Water Damage – Burst Pipe",
    health: 68,
    completedStages: [1, 2, 3],
    activation: {
      "stage_1_complete": Date.now() - (5 * 24 * 60 * 60 * 1000),
      "stage_2_complete": Date.now() - (3 * 24 * 60 * 60 * 1000),
      "stage_3_complete": Date.now() - (1 * 24 * 60 * 60 * 1000),
      "rom_run": Date.now() - (2 * 24 * 60 * 60 * 1000),
      "evidence_organizer_opened": Date.now() - (4 * 24 * 60 * 60 * 1000)
    },
    roadmapState: {
      completedStageIds: [1, 2, 3],
      currentStageId: 4
    }
  },
  hurricane: {
    title: "Hurricane Loss – Roof & Interior",
    health: 91,
    completedStages: [1, 2, 3, 4, 5],
    activation: {
      "stage_1_complete": Date.now() - (10 * 24 * 60 * 60 * 1000),
      "stage_2_complete": Date.now() - (8 * 24 * 60 * 60 * 1000),
      "stage_3_complete": Date.now() - (6 * 24 * 60 * 60 * 1000),
      "stage_4_complete": Date.now() - (4 * 24 * 60 * 60 * 1000),
      "stage_5_complete": Date.now() - (2 * 24 * 60 * 60 * 1000),
      "ai_agent_used": Date.now() - (5 * 24 * 60 * 60 * 1000),
      "negotiation_script_opened": Date.now() - (3 * 24 * 60 * 60 * 1000),
      "first_doc_generated": Date.now() - (9 * 24 * 60 * 60 * 1000),
      "evidence_organizer_opened": Date.now() - (8 * 24 * 60 * 60 * 1000),
      "rom_run": Date.now() - (6 * 24 * 60 * 60 * 1000),
      "completed_3_stages": Date.now() - (6 * 24 * 60 * 60 * 1000)
    },
    roadmapState: {
      completedStageIds: [1, 2, 3, 4, 5],
      currentStageId: 6
    }
  }
};

function loadSampleClaim(sampleKey) {
  if (!window.CNDemo || !CNDemo.isDemoMode()) {
    alert("Enable Demo Mode first.");
    return;
  }
  
  const sample = CNSampleClaims[sampleKey];
  if (!sample) {
    alert("Sample claim not found.");
    return;
  }
  
  // Load activation data
  localStorage.setItem("cn_activation", JSON.stringify(sample.activation));
  
  // Load roadmap state
  localStorage.setItem("claimRoadmapProgress", JSON.stringify(sample.roadmapState));
  
  // Set sample claim title
  localStorage.setItem("cn_user_sample_claim_title", sample.title);
  
  // Set claim health (for display)
  localStorage.setItem("cn_sample_claim_health", sample.health.toString());
  
  // Log to analytics
  if (window.CNAnalytics) {
    CNAnalytics.log("sample_claim_loaded", { sampleKey, title: sample.title });
  }
  
  alert(`Loaded sample claim: ${sample.title}`);
  location.reload();
}

// Make function globally accessible
window.loadSampleClaim = loadSampleClaim;


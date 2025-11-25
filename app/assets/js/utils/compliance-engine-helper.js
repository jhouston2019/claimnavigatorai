/**
 * Compliance Engine Helper
 * Shared utilities for Compliance Engine API integration
 */

/**
 * Call Compliance Engine analyze endpoint
 */
export async function analyzeCompliance(claimData) {
  try {
    const response = await fetch('/.netlify/functions/compliance-engine/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(claimData)
    });

    if (!response.ok) {
      throw new Error(`Compliance analysis failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Compliance Engine analyze error:', error);
    throw error;
  }
}

/**
 * Apply deadlines from Compliance Engine to timeline
 */
export async function applyDeadlines(state, carrier, claimType, events = []) {
  try {
    const response = await fetch('/.netlify/functions/compliance-engine/apply-deadlines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state,
        carrier,
        claimType,
        events
      })
    });

    if (!response.ok) {
      throw new Error(`Apply deadlines failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Compliance Engine apply deadlines error:', error);
    throw error;
  }
}

/**
 * Run violation check on evidence
 */
export async function runViolationCheck(state, carrier, evidenceData) {
  try {
    const response = await fetch('/.netlify/functions/compliance-engine/run-violation-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state,
        carrier,
        evidenceData
      })
    });

    if (!response.ok) {
      throw new Error(`Violation check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Compliance Engine violation check error:', error);
    throw error;
  }
}

/**
 * Get compliance summary for FNOL
 */
export async function getFNOLComplianceSummary(state, carrier, claimType, dateOfLoss) {
  try {
    const response = await fetch('/.netlify/functions/compliance-engine/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state,
        carrier,
        claimType,
        events: [{
          name: 'First Notice of Loss',
          date: dateOfLoss,
          description: 'Initial claim filing'
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Compliance summary failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract key deadlines for FNOL summary
    return {
      requiredDeadlines: extractKeyDeadlines(data.statutoryDeadlines),
      fastNoticeWarning: checkFastNoticeRequirement(state, data.statutoryDeadlines),
      complianceChecklist: extractComplianceChecklist(data)
    };
  } catch (error) {
    console.error('FNOL compliance summary error:', error);
    return {
      requiredDeadlines: [],
      fastNoticeWarning: false,
      complianceChecklist: []
    };
  }
}

/**
 * Extract key deadlines from statutory deadlines text
 */
function extractKeyDeadlines(statutoryDeadlinesText) {
  if (!statutoryDeadlinesText) return [];
  
  const deadlines = [];
  const lines = statutoryDeadlinesText.split('\n');
  
  for (const line of lines) {
    if (line.includes('acknowledgment') || line.includes('response') || line.includes('payment')) {
      deadlines.push(line.trim());
    }
  }
  
  return deadlines.slice(0, 5); // Return top 5
}

/**
 * Check if state requires fast notice
 */
function checkFastNoticeRequirement(state, statutoryDeadlinesText) {
  if (!statutoryDeadlinesText) return false;
  
  const fastNoticeStates = ['FL', 'TX', 'CA', 'LA'];
  if (fastNoticeStates.includes(state)) {
    return true;
  }
  
  const text = statutoryDeadlinesText.toLowerCase();
  return text.includes('immediate') || text.includes('within 24 hours') || text.includes('within 48 hours');
}

/**
 * Extract compliance checklist
 */
function extractComplianceChecklist(data) {
  const checklist = [];
  
  if (data.requiredDocuments) {
    checklist.push('Review required documents');
  }
  
  if (data.statutoryDeadlines) {
    checklist.push('Note statutory deadlines');
  }
  
  if (data.violationsLikelihood && data.violationsLikelihood.redFlags) {
    checklist.push('Review potential red flags');
  }
  
  return checklist;
}


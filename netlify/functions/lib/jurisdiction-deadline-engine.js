/**
 * Jurisdiction-Specific Deadline Engine
 * State-specific insurance claim deadlines, statutes of limitations, and regulatory requirements
 */

/**
 * State-specific deadline database
 * Based on state insurance regulations and statutes of limitations
 */
const STATE_DEADLINES = {
  // Alabama
  'AL': {
    statute_of_limitations: { years: 2, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'Payment after proof of loss' },
    appraisal_demand: { days: 365, description: 'Must be demanded within policy period' },
    suit_filing: { years: 2, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Separate tort action' },
    special_requirements: ['Appraisal available for amount disputes', 'Bad faith requires separate action']
  },
  
  // California
  'CA': {
    statute_of_limitations: { years: 4, description: 'Written contract claims' },
    prompt_payment: { days: 40, description: 'After proof of loss received' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    investigation_completion: { days: 40, description: 'Complete investigation' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 4, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Tort action for bad faith' },
    special_requirements: ['CA Fair Claims Settlement Practices', 'Strict prompt payment laws', 'Bad faith penalties available']
  },
  
  // Florida
  'FL': {
    statute_of_limitations: { years: 5, description: 'Contract claims' },
    prompt_payment: { days: 90, description: 'After proof of loss' },
    claim_acknowledgment: { days: 14, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 5, description: 'From date of loss' },
    bad_faith_statute: { years: 5, description: 'Civil remedy notice required' },
    special_requirements: ['Civil remedy notice required before bad faith suit', 'Assignment of benefits restrictions', 'Appraisal widely used']
  },
  
  // Texas
  'TX': {
    statute_of_limitations: { years: 4, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    investigation_completion: { days: 15, description: 'After receiving all materials' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 4, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Prompt Payment Act violations' },
    special_requirements: ['TX Prompt Payment Act', '18% penalty interest for delays', 'Bad faith has statutory penalties']
  },
  
  // New York
  'NY': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 6, description: 'Breach of implied covenant' },
    special_requirements: ['NY Reg 64 claims handling standards', 'Longest statute of limitations', 'Strong consumer protections']
  },
  
  // Illinois
  'IL': {
    statute_of_limitations: { years: 10, description: 'Written contract claims' },
    prompt_payment: { days: 45, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 10, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Vexatious delay statute' },
    special_requirements: ['Longest statute of limitations in US', 'Vexatious delay penalties', 'Consumer-friendly jurisdiction']
  },
  
  // Pennsylvania
  'PA': {
    statute_of_limitations: { years: 4, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 4, description: 'From date of loss' },
    bad_faith_statute: { years: 4, description: '42 Pa.C.S. § 8371' },
    special_requirements: ['PA Bad Faith statute 42 Pa.C.S. § 8371', 'Punitive damages available', 'Attorney fees recoverable']
  },
  
  // Georgia
  'GA': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 4, description: 'Tort action' },
    special_requirements: ['Appraisal frequently ordered', 'Bad faith requires separate tort action']
  },
  
  // North Carolina
  'NC': {
    statute_of_limitations: { years: 3, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 3, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'Unfair claims practices' },
    special_requirements: ['Shorter statute of limitations', 'NCDOI complaint process available']
  },
  
  // Ohio
  'OH': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 4, description: 'Tort action' },
    special_requirements: ['Appraisal binding in most cases', 'Bad faith difficult to prove']
  },
  
  // Michigan
  'MI': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'Tort action' },
    special_requirements: ['No-fault auto insurance state', 'Property claims follow standard rules']
  },
  
  // Arizona
  'AZ': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 10, description: 'Must acknowledge claim' },
    investigation_completion: { days: 30, description: 'Complete investigation' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Tort action' },
    special_requirements: ['Fast claim acknowledgment required', 'Bad faith penalties available']
  },
  
  // Colorado
  'CO': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 10, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Unreasonable delay/denial' },
    special_requirements: ['CO Revised Statutes § 10-3-1115', 'Statutory penalties for bad faith', 'Attorney fees recoverable']
  },
  
  // Washington
  'WA': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 10, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'Consumer Protection Act' },
    special_requirements: ['WA Consumer Protection Act applies', 'Treble damages available', 'Attorney fees recoverable']
  },
  
  // Massachusetts
  'MA': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'M.G.L. c. 93A' },
    special_requirements: ['MA Chapter 93A consumer protection', 'Multiple damages available', 'Attorney fees recoverable', 'Demand letter required']
  },
  
  // New Jersey
  'NJ': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 10, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 6, description: 'Breach of covenant' },
    special_requirements: ['Strong consumer protections', 'Bad faith includes negligent claims handling']
  },
  
  // Virginia
  'VA': {
    statute_of_limitations: { years: 5, description: 'Written contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 5, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Limited bad faith recognition' },
    special_requirements: ['Limited bad faith remedies', 'Focus on contract breach']
  },
  
  // Louisiana
  'LA': {
    statute_of_limitations: { years: 10, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After satisfactory proof of loss' },
    claim_acknowledgment: { days: 14, description: 'Must acknowledge claim' },
    investigation_completion: { days: 30, description: 'Complete investigation' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 10, description: 'From date of loss' },
    bad_faith_statute: { years: 1, description: 'LA RS 22:1973 penalties' },
    special_requirements: ['LA RS 22:1973 - Strongest bad faith statute', 'Automatic penalties for delays', '50% penalty + attorney fees', 'Very policyholder-friendly']
  },
  
  // Tennessee
  'TN': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 1, description: 'TN Code § 56-7-105' },
    special_requirements: ['TN Code § 56-7-105 penalties', '25% penalty for bad faith', 'Attorney fees recoverable']
  },
  
  // Missouri
  'MO': {
    statute_of_limitations: { years: 10, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 10, description: 'From date of loss' },
    bad_faith_statute: { years: 5, description: 'Vexatious refusal' },
    special_requirements: ['MO vexatious refusal statute', 'Attorney fees available']
  },
  
  // Indiana
  'IN': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Limited bad faith' },
    special_requirements: ['Limited bad faith remedies', 'Focus on contract breach']
  },
  
  // South Carolina
  'SC': {
    statute_of_limitations: { years: 3, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 3, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'Unfair claims practices' },
    special_requirements: ['Shorter statute of limitations', 'Bad faith difficult to prove']
  },
  
  // Minnesota
  'MN': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 6, description: 'Breach of duty' },
    special_requirements: ['Bad faith recognized', 'Consequential damages available']
  },
  
  // Wisconsin
  'WI': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 6, description: 'WI Stat § 628.46' },
    special_requirements: ['WI Stat § 628.46 bad faith', 'Damages capped at policy limits']
  },
  
  // Maryland
  'MD': {
    statute_of_limitations: { years: 3, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 3, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'Limited bad faith' },
    special_requirements: ['Shorter statute of limitations', 'Limited bad faith remedies']
  },
  
  // Nevada
  'NV': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'NRS 686A.310' },
    special_requirements: ['NV Unfair Claims Practices Act', 'Statutory penalties available']
  },
  
  // Oregon
  'OR': {
    statute_of_limitations: { years: 6, description: 'Written contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 10, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'ORS 746.230' },
    special_requirements: ['OR Unfair Claims Settlement Practices', 'Penalties available']
  },
  
  // Connecticut
  'CT': {
    statute_of_limitations: { years: 6, description: 'Contract claims' },
    prompt_payment: { days: 30, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 3, description: 'CUTPA' },
    special_requirements: ['CT Unfair Trade Practices Act (CUTPA)', 'Punitive damages available']
  },
  
  // Oklahoma
  'OK': {
    statute_of_limitations: { years: 5, description: 'Written contract claims' },
    prompt_payment: { days: 45, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 5, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: '36 O.S. § 3629' },
    special_requirements: ['OK bad faith statute 36 O.S. § 3629', 'Penalties available']
  },
  
  // Kentucky
  'KY': {
    statute_of_limitations: { years: 15, description: 'Written contract claims' },
    prompt_payment: { days: 60, description: 'After proof of loss' },
    claim_acknowledgment: { days: 15, description: 'Must acknowledge claim' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 15, description: 'From date of loss' },
    bad_faith_statute: { years: 5, description: 'Tort action' },
    special_requirements: ['Longest statute of limitations', 'Bad faith recognized']
  },
  
  // DEFAULT (if state not found)
  'DEFAULT': {
    statute_of_limitations: { years: 6, description: 'Typical contract claims' },
    prompt_payment: { days: 60, description: 'Typical requirement' },
    claim_acknowledgment: { days: 15, description: 'Typical requirement' },
    appraisal_demand: { days: 365, description: 'Within policy period' },
    suit_filing: { years: 6, description: 'From date of loss' },
    bad_faith_statute: { years: 2, description: 'Varies by state' },
    special_requirements: ['Consult local attorney for specific requirements']
  }
};

/**
 * Calculate deadline dates
 */
function calculateDeadlines(dateOfLoss, state) {
  const deadlineData = STATE_DEADLINES[state] || STATE_DEADLINES.DEFAULT;
  const lossDate = new Date(dateOfLoss);
  const today = new Date();
  
  const deadlines = {
    state,
    date_of_loss: dateOfLoss,
    calculated_date: today.toISOString().split('T')[0],
    days_since_loss: Math.floor((today - lossDate) / (1000 * 60 * 60 * 24)),
    deadlines: {}
  };
  
  // Calculate each deadline
  for (const [key, value] of Object.entries(deadlineData)) {
    if (key === 'special_requirements') continue;
    
    let deadlineDate;
    let daysRemaining;
    
    if (value.years) {
      deadlineDate = new Date(lossDate);
      deadlineDate.setFullYear(deadlineDate.getFullYear() + value.years);
      daysRemaining = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
    } else if (value.days) {
      deadlineDate = new Date(lossDate);
      deadlineDate.setDate(deadlineDate.getDate() + value.days);
      daysRemaining = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
    }
    
    deadlines.deadlines[key] = {
      description: value.description,
      deadline_date: deadlineDate.toISOString().split('T')[0],
      days_remaining: daysRemaining,
      status: daysRemaining < 0 ? 'expired' : daysRemaining < 30 ? 'urgent' : daysRemaining < 90 ? 'approaching' : 'active',
      urgency: daysRemaining < 0 ? 'expired' : daysRemaining < 30 ? 'critical' : daysRemaining < 90 ? 'high' : 'normal'
    };
  }
  
  deadlines.special_requirements = deadlineData.special_requirements;
  
  return deadlines;
}

/**
 * Generate deadline warnings
 */
function generateDeadlineWarnings(deadlines) {
  const warnings = [];
  
  for (const [key, deadline] of Object.entries(deadlines.deadlines)) {
    if (deadline.status === 'expired') {
      warnings.push({
        priority: 'critical',
        category: 'deadline_expired',
        deadline_type: key,
        title: `${deadline.description} - EXPIRED`,
        description: `Deadline expired ${Math.abs(deadline.days_remaining)} days ago`,
        action: 'Consult attorney immediately. Some remedies may still be available.',
        impact: 'May have lost certain rights or remedies'
      });
    } else if (deadline.urgency === 'critical') {
      warnings.push({
        priority: 'critical',
        category: 'deadline_urgent',
        deadline_type: key,
        title: `${deadline.description} - URGENT`,
        description: `Only ${deadline.days_remaining} days remaining`,
        action: 'Take immediate action to preserve rights',
        impact: 'Risk losing rights if deadline missed'
      });
    } else if (deadline.urgency === 'high') {
      warnings.push({
        priority: 'high',
        category: 'deadline_approaching',
        deadline_type: key,
        title: `${deadline.description} - Approaching`,
        description: `${deadline.days_remaining} days remaining`,
        action: 'Begin preparing necessary documentation and actions',
        impact: 'Plan ahead to avoid missing deadline'
      });
    }
  }
  
  return warnings;
}

/**
 * Get state-specific requirements
 */
function getStateRequirements(state) {
  const deadlineData = STATE_DEADLINES[state] || STATE_DEADLINES.DEFAULT;
  
  return {
    state,
    statute_of_limitations: deadlineData.statute_of_limitations,
    prompt_payment: deadlineData.prompt_payment,
    claim_acknowledgment: deadlineData.claim_acknowledgment,
    investigation_completion: deadlineData.investigation_completion,
    appraisal_demand: deadlineData.appraisal_demand,
    suit_filing: deadlineData.suit_filing,
    bad_faith_statute: deadlineData.bad_faith_statute,
    special_requirements: deadlineData.special_requirements,
    policyholder_friendly: assessPolicyholderFriendliness(deadlineData)
  };
}

/**
 * Assess how policyholder-friendly a jurisdiction is
 */
function assessPolicyholderFriendliness(deadlineData) {
  let score = 0;
  
  // Longer statute of limitations is better
  if (deadlineData.statute_of_limitations.years >= 6) score += 2;
  else if (deadlineData.statute_of_limitations.years >= 4) score += 1;
  
  // Shorter prompt payment is better
  if (deadlineData.prompt_payment.days <= 30) score += 2;
  else if (deadlineData.prompt_payment.days <= 45) score += 1;
  
  // Strong bad faith remedies
  if (deadlineData.special_requirements.some(req => 
    req.includes('penalty') || req.includes('damages') || req.includes('attorney fees')
  )) {
    score += 3;
  }
  
  // Special protections
  if (deadlineData.special_requirements.some(req => 
    req.includes('consumer protection') || req.includes('strongest')
  )) {
    score += 2;
  }
  
  if (score >= 7) return 'very_favorable';
  if (score >= 5) return 'favorable';
  if (score >= 3) return 'moderate';
  return 'carrier_friendly';
}

/**
 * Generate compliance checklist
 */
function generateComplianceChecklist(deadlines, claimData) {
  const checklist = [];
  
  // Check if claim was acknowledged timely
  if (claimData.claim_acknowledgment_date) {
    const ackDate = new Date(claimData.claim_acknowledgment_date);
    const lossDate = new Date(claimData.date_of_loss);
    const daysTaken = Math.floor((ackDate - lossDate) / (1000 * 60 * 60 * 24));
    const required = deadlines.deadlines.claim_acknowledgment?.days_remaining || 15;
    
    if (daysTaken > required) {
      checklist.push({
        item: 'Claim Acknowledgment',
        status: 'violation',
        required_days: required,
        actual_days: daysTaken,
        message: `Carrier took ${daysTaken} days to acknowledge claim. Required: ${required} days.`,
        remedy: 'Document delay. May support bad faith claim.'
      });
    } else {
      checklist.push({
        item: 'Claim Acknowledgment',
        status: 'compliant',
        message: `Carrier acknowledged claim within ${required} days`
      });
    }
  }
  
  // Check if investigation completed timely
  if (claimData.investigation_completion_date) {
    const invDate = new Date(claimData.investigation_completion_date);
    const lossDate = new Date(claimData.date_of_loss);
    const daysTaken = Math.floor((invDate - lossDate) / (1000 * 60 * 60 * 24));
    const required = deadlines.deadlines.investigation_completion?.days_remaining || 40;
    
    if (daysTaken > required) {
      checklist.push({
        item: 'Investigation Completion',
        status: 'violation',
        required_days: required,
        actual_days: daysTaken,
        message: `Investigation took ${daysTaken} days. Required: ${required} days.`,
        remedy: 'Document delay. May support bad faith claim.'
      });
    }
  }
  
  // Check if payment made timely
  if (claimData.payment_date && claimData.proof_of_loss_date) {
    const payDate = new Date(claimData.payment_date);
    const polDate = new Date(claimData.proof_of_loss_date);
    const daysTaken = Math.floor((payDate - polDate) / (1000 * 60 * 60 * 24));
    const required = deadlines.deadlines.prompt_payment?.days_remaining || 60;
    
    if (daysTaken > required) {
      checklist.push({
        item: 'Prompt Payment',
        status: 'violation',
        required_days: required,
        actual_days: daysTaken,
        message: `Payment took ${daysTaken} days after proof of loss. Required: ${required} days.`,
        remedy: 'May be entitled to penalty interest or damages for payment delay.'
      });
    }
  }
  
  return checklist;
}

/**
 * Main deadline calculation function
 */
function calculateJurisdictionDeadlines(dateOfLoss, state, claimData = {}) {
  console.log(`[Jurisdiction Engine] Calculating deadlines for ${state}...`);
  
  const deadlines = calculateDeadlines(dateOfLoss, state);
  const warnings = generateDeadlineWarnings(deadlines);
  const requirements = getStateRequirements(state);
  const complianceChecklist = generateComplianceChecklist(deadlines, claimData);
  
  return {
    deadlines,
    warnings,
    requirements,
    compliance_checklist: complianceChecklist,
    policyholder_friendliness: requirements.policyholder_friendly
  };
}

module.exports = {
  calculateJurisdictionDeadlines,
  calculateDeadlines,
  generateDeadlineWarnings,
  getStateRequirements,
  generateComplianceChecklist,
  STATE_DEADLINES
};

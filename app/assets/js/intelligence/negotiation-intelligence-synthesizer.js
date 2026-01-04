/**
 * NEGOTIATION INTELLIGENCE SYNTHESIZER
 * Synthesizes intelligence from posture, signals, and claim state
 * 
 * CRITICAL CONSTRAINTS:
 * - Intelligence ONLY, not advice
 * - Factual observations
 * - "What exists", not "what to do"
 * - No recommendations
 * - No strategy
 */

// Import dependencies (for Node.js)
let classifyNegotiationPosture, extractLeverageSignals, validateTransition;

if (typeof require !== 'undefined') {
  try {
    const postureClassifier = require('./negotiation-posture-classifier.js');
    const leverageExtractor = require('./leverage-signal-extractor.js');
    const stateMachine = require('./claim-state-machine.js');
    
    classifyNegotiationPosture = postureClassifier.classifyNegotiationPosture;
    extractLeverageSignals = leverageExtractor.extractLeverageSignals;
    validateTransition = stateMachine.validateTransition;
  } catch (err) {
    // Dependencies will be available in browser context
  }
}

// ============================================================================
// INTELLIGENCE SYNTHESIS
// ============================================================================

/**
 * Synthesizes negotiation intelligence
 * @param {Object} params - Synthesis parameters
 * @returns {Object} Intelligence summary
 */
function synthesizeNegotiationIntelligence(params) {
  const {
    carrierResponse,
    estimateDelta,
    scopeRegression,
    claimState,
    submissionHistory = [],
    claimTimeline = {}
  } = params;

  // Classify negotiation posture
  const postureClassification = classifyNegotiationPosture({
    carrierResponse,
    claimState,
    estimateDelta,
    scopeRegression
  });

  // Extract leverage signals
  const leverageSignals = extractLeverageSignals({
    estimateDelta,
    carrierResponse,
    submissionHistory,
    claimTimeline
  });

  // Get state constraints
  const stateConstraints = getStateConstraints(claimState);

  // Generate neutral observations
  const observations = generateNeutralObservations({
    postureClassification,
    leverageSignals,
    carrierResponse,
    estimateDelta,
    scopeRegression
  });

  // Generate intelligence summary
  const summary = generateIntelligenceSummary({
    postureClassification,
    leverageSignals,
    observations,
    stateConstraints
  });

  return {
    summary,
    posture: postureClassification,
    signals: leverageSignals,
    observations,
    stateConstraints,
    metadata: {
      synthesizedAt: new Date().toISOString(),
      claimState,
      signalCount: leverageSignals.signalCount
    }
  };
}

/**
 * Gets state constraints for current claim state
 * @param {string} claimState - Current claim state
 * @returns {Object} State constraints
 */
function getStateConstraints(claimState) {
  const constraints = {
    currentState: claimState,
    allowedActions: [],
    blockedActions: [],
    requiresValidation: true
  };

  // Define allowed actions per state
  const stateActions = {
    CARRIER_RESPONSE_RECEIVED: {
      allowed: ['review_response', 'analyze_delta', 'identify_issues'],
      blocked: ['submit', 'escalate']
    },
    DISPUTE_IDENTIFIED: {
      allowed: ['prepare_supplement', 'gather_evidence', 'document_issues'],
      blocked: ['close_claim']
    },
    SUPPLEMENT_PREPARED: {
      allowed: ['review_supplement', 'validate_readiness'],
      blocked: ['escalate_immediately']
    },
    RESUBMITTED: {
      allowed: ['await_response', 'track_timeline'],
      blocked: ['submit_again']
    },
    ESCALATION_CONSIDERED: {
      allowed: ['review_escalation_criteria', 'document_attempts'],
      blocked: ['automatic_escalation']
    }
  };

  const actions = stateActions[claimState] || { allowed: [], blocked: [] };
  constraints.allowedActions = actions.allowed;
  constraints.blockedActions = actions.blocked;

  return constraints;
}

/**
 * Generates neutral observations
 * @param {Object} params - Observation parameters
 * @returns {Array} Observations
 */
function generateNeutralObservations(params) {
  const {
    postureClassification,
    leverageSignals,
    carrierResponse,
    estimateDelta,
    scopeRegression
  } = params;

  const observations = [];

  // Observation 1: Posture
  observations.push({
    category: 'POSTURE',
    observation: `Carrier response classified as ${postureClassification.postureType}`,
    confidence: postureClassification.confidence,
    source: 'posture_classification'
  });

  // Observation 2: Scope changes
  if (scopeRegression?.regressionDetected) {
    observations.push({
      category: 'SCOPE',
      observation: `Scope regression detected: ${scopeRegression.regressionType}`,
      confidence: 'HIGH',
      source: 'scope_regression_detector'
    });
  }

  // Observation 3: Estimate differences
  if (estimateDelta?.removedLineItems?.length > 0) {
    observations.push({
      category: 'ESTIMATE',
      observation: `${estimateDelta.removedLineItems.length} line item(s) not present in carrier estimate`,
      confidence: 'HIGH',
      source: 'estimate_delta'
    });
  }

  if (estimateDelta?.reducedQuantities?.length > 0) {
    observations.push({
      category: 'ESTIMATE',
      observation: `${estimateDelta.reducedQuantities.length} quantity difference(s) detected`,
      confidence: 'HIGH',
      source: 'estimate_delta'
    });
  }

  // Observation 4: Leverage signals
  if (leverageSignals.signalCount > 0) {
    observations.push({
      category: 'SIGNALS',
      observation: `${leverageSignals.signalCount} leverage signal(s) identified`,
      confidence: 'HIGH',
      source: 'leverage_signal_extractor'
    });
  }

  // Observation 5: Response type
  if (carrierResponse?.responseType) {
    observations.push({
      category: 'RESPONSE',
      observation: `Carrier response type: ${carrierResponse.responseType}`,
      confidence: carrierResponse.confidence || 'MEDIUM',
      source: 'carrier_response_classifier'
    });
  }

  return observations;
}

/**
 * Generates intelligence summary
 * @param {Object} params - Summary parameters
 * @returns {string} Summary text
 */
function generateIntelligenceSummary(params) {
  const {
    postureClassification,
    leverageSignals,
    observations,
    stateConstraints
  } = params;

  const parts = [];

  // Part 1: Current state
  parts.push(`Current claim state: ${stateConstraints.currentState}`);

  // Part 2: Posture
  parts.push(`Carrier posture: ${postureClassification.postureType} (${postureClassification.confidence} confidence)`);

  // Part 3: Key observations
  if (observations.length > 0) {
    const highConfidenceObs = observations.filter(o => o.confidence === 'HIGH');
    if (highConfidenceObs.length > 0) {
      parts.push(`Key observations: ${highConfidenceObs.length} high-confidence finding(s)`);
    }
  }

  // Part 4: Signals
  if (leverageSignals.signalCount > 0) {
    parts.push(`Leverage signals: ${leverageSignals.signalCount} factual signal(s) identified`);
  } else {
    parts.push('Leverage signals: None detected');
  }

  // Part 5: State constraints
  if (stateConstraints.allowedActions.length > 0) {
    parts.push(`Available actions: ${stateConstraints.allowedActions.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Validates intelligence synthesis
 * @param {Object} intelligence - Intelligence to validate
 * @returns {Object} Validation result
 */
function validateIntelligence(intelligence) {
  const issues = [];

  // Check required fields
  if (!intelligence.summary) {
    issues.push('Missing summary');
  }

  if (!intelligence.posture) {
    issues.push('Missing posture classification');
  }

  if (!intelligence.signals) {
    issues.push('Missing leverage signals');
  }

  if (!intelligence.observations) {
    issues.push('Missing observations');
  }

  if (!intelligence.stateConstraints) {
    issues.push('Missing state constraints');
  }

  // Check for prohibited language
  const prohibitedWords = ['should', 'must', 'recommend', 'advise', 'negotiate', 'demand', 'entitled', 'owed'];
  const summaryText = (intelligence.summary || '').toLowerCase();

  prohibitedWords.forEach(word => {
    if (summaryText.includes(word)) {
      issues.push(`Prohibited word in summary: ${word}`);
    }
  });

  // Check observations for advice
  if (Array.isArray(intelligence.observations)) {
    intelligence.observations.forEach((obs, index) => {
      const obsText = (obs.observation || '').toLowerCase();
      prohibitedWords.forEach(word => {
        if (obsText.includes(word)) {
          issues.push(`Prohibited word in observation ${index}: ${word}`);
        }
      });
    });
  }

  const valid = issues.length === 0;

  return {
    valid,
    issues
  };
}

/**
 * Gets intelligence summary for specific aspect
 * @param {Object} intelligence - Intelligence object
 * @param {string} aspect - Aspect to summarize
 * @returns {string} Aspect summary
 */
function getAspectSummary(intelligence, aspect) {
  switch (aspect) {
    case 'posture':
      return `${intelligence.posture.postureType} (${intelligence.posture.confidence})`;
    
    case 'signals':
      return `${intelligence.signals.signalCount} signal(s)`;
    
    case 'observations':
      return `${intelligence.observations.length} observation(s)`;
    
    case 'state':
      return intelligence.stateConstraints.currentState;
    
    default:
      return 'Unknown aspect';
  }
}

/**
 * Filters observations by category
 * @param {Object} intelligence - Intelligence object
 * @param {string} category - Category to filter
 * @returns {Array} Filtered observations
 */
function filterObservationsByCategory(intelligence, category) {
  return intelligence.observations.filter(obs => obs.category === category);
}

/**
 * Checks if intelligence is deterministic
 * @param {Object} intelligence1 - First intelligence
 * @param {Object} intelligence2 - Second intelligence
 * @returns {boolean} True if identical
 */
function isDeterministic(intelligence1, intelligence2) {
  // Compare posture types
  if (intelligence1.posture.postureType !== intelligence2.posture.postureType) {
    return false;
  }

  // Compare signal counts
  if (intelligence1.signals.signalCount !== intelligence2.signals.signalCount) {
    return false;
  }

  // Compare observation counts
  if (intelligence1.observations.length !== intelligence2.observations.length) {
    return false;
  }

  // Compare states
  if (intelligence1.stateConstraints.currentState !== intelligence2.stateConstraints.currentState) {
    return false;
  }

  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    synthesizeNegotiationIntelligence,
    getStateConstraints,
    generateNeutralObservations,
    generateIntelligenceSummary,
    validateIntelligence,
    getAspectSummary,
    filterObservationsByCategory,
    isDeterministic
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.NegotiationIntelligenceSynthesizer = {
    synthesizeNegotiationIntelligence,
    getStateConstraints,
    generateNeutralObservations,
    generateIntelligenceSummary,
    validateIntelligence,
    getAspectSummary,
    filterObservationsByCategory,
    isDeterministic
  };
}


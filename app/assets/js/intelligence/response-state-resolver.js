/**
 * RESPONSE STATE RESOLVER
 * Determines next allowed claim state based on response + current state
 * 
 * CRITICAL CONSTRAINTS:
 * - MUST USE existing claim-state-machine.js
 * - No automatic escalation
 * - No negotiation triggers
 * - Must respect state machine rules
 */

const { CLAIM_STATE, validateTransition } = require('./claim-state-machine');
const { RESPONSE_TYPE } = require('./carrier-response-classifier');

// ============================================================================
// STATE RESOLUTION
// ============================================================================

/**
 * Resolves next claim state based on carrier response
 * @param {Object} params - Resolution parameters
 * @returns {Object} State resolution
 */
function resolveNextState(params) {
  const {
    currentState,
    responseClassification,
    scopeRegression = null
  } = params;

  const blockingReasons = [];
  let nextState = null;
  let allowed = false;

  // Validate current state
  if (!currentState || !CLAIM_STATE[currentState]) {
    blockingReasons.push('Invalid current state');
    return {
      nextState: null,
      allowed: false,
      blockingReasons
    };
  }

  // If claim is closed, it stays closed
  if (currentState === CLAIM_STATE.CLOSED) {
    return {
      nextState: CLAIM_STATE.CLOSED,
      allowed: true,
      blockingReasons: ['Claim is closed'],
      metadata: {
        resolvedAt: new Date().toISOString(),
        currentState,
        responseType: responseClassification?.responseType,
        scopeRegressionDetected: scopeRegression?.regressionDetected || false
      }
    };
  }

  // Determine next state based on response type
  const responseType = responseClassification?.responseType;

  if (!responseType) {
    blockingReasons.push('No response type provided');
    return {
      nextState: null,
      allowed: false,
      blockingReasons
    };
  }

  // State resolution logic based on response type
  switch (responseType) {
    case RESPONSE_TYPE.ACKNOWLEDGMENT:
      // Acknowledgment doesn't change state
      nextState = currentState;
      blockingReasons.push('Acknowledgment does not trigger state change');
      break;

    case RESPONSE_TYPE.FULL_APPROVAL:
      // Full approval can close claim
      nextState = CLAIM_STATE.CLOSED;
      break;

    case RESPONSE_TYPE.PARTIAL_APPROVAL:
      // Partial approval moves to response received
      if (currentState === CLAIM_STATE.SUBMITTED) {
        nextState = CLAIM_STATE.CARRIER_RESPONSE_RECEIVED;
      } else if (currentState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED) {
        // Already in response received, check if supplement eligible
        nextState = CLAIM_STATE.DISPUTE_IDENTIFIED;
      }
      break;

    case RESPONSE_TYPE.SCOPE_REDUCTION:
      // Scope reduction indicates dispute
      if (currentState === CLAIM_STATE.SUBMITTED) {
        // Must go through CARRIER_RESPONSE_RECEIVED first
        nextState = CLAIM_STATE.CARRIER_RESPONSE_RECEIVED;
      } else if (currentState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED) {
        nextState = CLAIM_STATE.DISPUTE_IDENTIFIED;
      }
      break;

    case RESPONSE_TYPE.DENIAL:
      // Denial moves to response received first, then can escalate
      if (currentState === CLAIM_STATE.SUBMITTED) {
        // Must go through CARRIER_RESPONSE_RECEIVED first
        nextState = CLAIM_STATE.CARRIER_RESPONSE_RECEIVED;
      } else if (currentState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED) {
        // From response received, can go to dispute or escalation
        nextState = CLAIM_STATE.DISPUTE_IDENTIFIED;
      } else if (currentState === CLAIM_STATE.DISPUTE_IDENTIFIED) {
        nextState = CLAIM_STATE.ESCALATION_CONSIDERED;
      }
      break;

    case RESPONSE_TYPE.REQUEST_FOR_INFORMATION:
      // RFI keeps in current state until information provided
      nextState = currentState;
      blockingReasons.push('Information request must be fulfilled before state change');
      break;

    case RESPONSE_TYPE.DELAY:
      // Delay keeps in current state
      nextState = currentState;
      blockingReasons.push('Carrier delay does not trigger state change');
      break;

    case RESPONSE_TYPE.NON_RESPONSE:
      // Non-response keeps in current state
      nextState = currentState;
      blockingReasons.push('No carrier response received');
      break;

    default:
      blockingReasons.push(`Unknown response type: ${responseType}`);
      nextState = currentState;
  }

  // If scope regression detected and we're already at CARRIER_RESPONSE_RECEIVED,
  // we can move to DISPUTE_IDENTIFIED
  if (scopeRegression && scopeRegression.regressionDetected) {
    if (currentState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED &&
        nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED) {
      // We're at response received with regression, can move to dispute
      nextState = CLAIM_STATE.DISPUTE_IDENTIFIED;
    }
    // If coming from SUBMITTED, must go to CARRIER_RESPONSE_RECEIVED first
    // (already handled by response type logic above)
  }

  // Validate transition using state machine
  if (nextState && nextState !== currentState) {
    const transitionValidation = validateTransition(currentState, nextState);
    
    if (transitionValidation.valid) {
      allowed = true;
    } else {
      allowed = false;
      blockingReasons.push(...(transitionValidation.reasons || []));
    }
  } else if (nextState === currentState) {
    // Staying in same state is always allowed
    allowed = true;
  }

  return {
    nextState,
    allowed,
    blockingReasons,
    metadata: {
      resolvedAt: new Date().toISOString(),
      currentState,
      responseType,
      scopeRegressionDetected: scopeRegression?.regressionDetected || false
    }
  };
}

/**
 * Checks if supplement is eligible
 * @param {Object} params - Check parameters
 * @returns {Object} Eligibility result
 */
function checkSupplementEligibility(params) {
  const {
    currentState,
    scopeRegression,
    responseClassification
  } = params;

  const eligible = 
    currentState === CLAIM_STATE.DISPUTE_IDENTIFIED ||
    (scopeRegression && scopeRegression.regressionDetected) ||
    (responseClassification && 
     [RESPONSE_TYPE.PARTIAL_APPROVAL, RESPONSE_TYPE.SCOPE_REDUCTION].includes(
       responseClassification.responseType
     ));

  const reasons = [];

  if (!eligible) {
    reasons.push('No dispute or scope regression detected');
  }

  if (currentState === CLAIM_STATE.CLOSED) {
    reasons.push('Claim is closed');
  }

  return {
    eligible: eligible && currentState !== CLAIM_STATE.CLOSED,
    reasons
  };
}

/**
 * Checks if escalation is eligible
 * @param {Object} params - Check parameters
 * @returns {Object} Eligibility result
 */
function checkEscalationEligibility(params) {
  const {
    currentState,
    responseClassification,
    submissionCount = 1
  } = params;

  const eligible = 
    currentState === CLAIM_STATE.DISPUTE_IDENTIFIED ||
    currentState === CLAIM_STATE.RESUBMITTED ||
    (responseClassification && 
     responseClassification.responseType === RESPONSE_TYPE.DENIAL) ||
    submissionCount >= 2;

  const reasons = [];

  if (!eligible) {
    reasons.push('Escalation criteria not met');
  }

  if (currentState === CLAIM_STATE.CLOSED) {
    reasons.push('Claim is closed');
  }

  return {
    eligible: eligible && currentState !== CLAIM_STATE.CLOSED,
    reasons
  };
}

/**
 * Gets available actions based on state and response
 * @param {Object} params - Action parameters
 * @returns {Array} Available actions
 */
function getAvailableActions(params) {
  const {
    currentState,
    responseClassification,
    scopeRegression
  } = params;

  const actions = [];

  // Check supplement eligibility
  const supplementCheck = checkSupplementEligibility({
    currentState,
    scopeRegression,
    responseClassification
  });

  if (supplementCheck.eligible) {
    actions.push({
      action: 'PREPARE_SUPPLEMENT',
      description: 'Prepare supplemental documentation',
      nextState: CLAIM_STATE.SUPPLEMENT_PREPARED
    });
  }

  // Check escalation eligibility
  const escalationCheck = checkEscalationEligibility({
    currentState,
    responseClassification
  });

  if (escalationCheck.eligible) {
    actions.push({
      action: 'CONSIDER_ESCALATION',
      description: 'Consider escalation options',
      nextState: CLAIM_STATE.ESCALATION_CONSIDERED
    });
  }

  // Always allow closing
  if (currentState !== CLAIM_STATE.CLOSED) {
    actions.push({
      action: 'CLOSE_CLAIM',
      description: 'Close claim',
      nextState: CLAIM_STATE.CLOSED
    });
  }

  // If RFI, allow providing information
  if (responseClassification && 
      responseClassification.responseType === RESPONSE_TYPE.REQUEST_FOR_INFORMATION) {
    actions.push({
      action: 'PROVIDE_INFORMATION',
      description: 'Provide requested information',
      nextState: currentState // Stays in same state until resubmitted
    });
  }

  return actions;
}

/**
 * Validates state resolution
 * @param {Object} resolution - Resolution to validate
 * @returns {Object} Validation result
 */
function validateStateResolution(resolution) {
  const issues = [];

  if (!resolution.nextState) {
    issues.push('Missing next state');
  }

  if (typeof resolution.allowed !== 'boolean') {
    issues.push('allowed must be boolean');
  }

  if (!Array.isArray(resolution.blockingReasons)) {
    issues.push('blockingReasons must be an array');
  }

  if (!resolution.allowed && resolution.blockingReasons.length === 0) {
    issues.push('Transition not allowed but no blocking reasons provided');
  }

  const valid = issues.length === 0;

  return {
    valid,
    issues
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resolveNextState,
    checkSupplementEligibility,
    checkEscalationEligibility,
    getAvailableActions,
    validateStateResolution
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.ResponseStateResolver = {
    resolveNextState,
    checkSupplementEligibility,
    checkEscalationEligibility,
    getAvailableActions,
    validateStateResolution
  };
}


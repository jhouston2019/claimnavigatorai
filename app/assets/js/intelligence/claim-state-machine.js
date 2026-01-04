/**
 * CLAIM STATE MACHINE
 * Canonical claim state management for Claim Navigator
 * 
 * Turns step-based workflow into state-aware system with:
 * - Explicit state transitions
 * - State-based step locking
 * - Audit trail
 * - Reversible transitions
 */

// ============================================================================
// CANONICAL CLAIM STATE ENUM
// ============================================================================

const CLAIM_STATE = {
  INTAKE: 'INTAKE',
  DOCUMENT_COLLECTION: 'DOCUMENT_COLLECTION',
  ESTIMATE_REVIEWED: 'ESTIMATE_REVIEWED',
  SUBMISSION_READY: 'SUBMISSION_READY',
  SUBMITTED: 'SUBMITTED',
  CARRIER_RESPONSE_RECEIVED: 'CARRIER_RESPONSE_RECEIVED',
  DISPUTE_IDENTIFIED: 'DISPUTE_IDENTIFIED',
  SUPPLEMENT_PREPARED: 'SUPPLEMENT_PREPARED',
  RESUBMITTED: 'RESUBMITTED',
  ESCALATION_CONSIDERED: 'ESCALATION_CONSIDERED',
  CLOSED: 'CLOSED'
};

// ============================================================================
// STATE TRANSITION RULES
// ============================================================================

/**
 * Defines valid state transitions
 * Key: current state
 * Value: array of allowed next states
 */
const STATE_TRANSITIONS = {
  [CLAIM_STATE.INTAKE]: [
    CLAIM_STATE.DOCUMENT_COLLECTION
  ],
  [CLAIM_STATE.DOCUMENT_COLLECTION]: [
    CLAIM_STATE.ESTIMATE_REVIEWED,
    CLAIM_STATE.INTAKE  // Can go back
  ],
  [CLAIM_STATE.ESTIMATE_REVIEWED]: [
    CLAIM_STATE.SUBMISSION_READY,
    CLAIM_STATE.DOCUMENT_COLLECTION  // Can go back
  ],
  [CLAIM_STATE.SUBMISSION_READY]: [
    CLAIM_STATE.SUBMITTED,
    CLAIM_STATE.ESTIMATE_REVIEWED  // Can go back
  ],
  [CLAIM_STATE.SUBMITTED]: [
    CLAIM_STATE.CARRIER_RESPONSE_RECEIVED,
    CLAIM_STATE.CLOSED  // Early settlement
  ],
  [CLAIM_STATE.CARRIER_RESPONSE_RECEIVED]: [
    CLAIM_STATE.DISPUTE_IDENTIFIED,
    CLAIM_STATE.CLOSED  // Accept response
  ],
  [CLAIM_STATE.DISPUTE_IDENTIFIED]: [
    CLAIM_STATE.SUPPLEMENT_PREPARED,
    CLAIM_STATE.ESCALATION_CONSIDERED,
    CLAIM_STATE.CLOSED  // Abandon dispute
  ],
  [CLAIM_STATE.SUPPLEMENT_PREPARED]: [
    CLAIM_STATE.RESUBMITTED,
    CLAIM_STATE.DISPUTE_IDENTIFIED  // Can go back
  ],
  [CLAIM_STATE.RESUBMITTED]: [
    CLAIM_STATE.CARRIER_RESPONSE_RECEIVED,
    CLAIM_STATE.ESCALATION_CONSIDERED,
    CLAIM_STATE.CLOSED
  ],
  [CLAIM_STATE.ESCALATION_CONSIDERED]: [
    CLAIM_STATE.CLOSED
  ],
  [CLAIM_STATE.CLOSED]: []  // Terminal state
};

// ============================================================================
// STEP REQUIREMENTS BY STATE
// ============================================================================

/**
 * Maps claim states to required completed steps
 * Enforces step completion before state transitions
 */
const STATE_STEP_REQUIREMENTS = {
  [CLAIM_STATE.INTAKE]: {
    requiredSteps: [],
    description: 'Initial claim intake'
  },
  [CLAIM_STATE.DOCUMENT_COLLECTION]: {
    requiredSteps: [1, 2, 3],  // Policy review, duties, damage documentation
    description: 'Collecting documentation'
  },
  [CLAIM_STATE.ESTIMATE_REVIEWED]: {
    requiredSteps: [1, 2, 3, 4, 5],  // + estimate quality & comparison
    description: 'Estimates analyzed'
  },
  [CLAIM_STATE.SUBMISSION_READY]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],  // Through package assembly
    description: 'Ready to submit'
  },
  [CLAIM_STATE.SUBMITTED]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  // + submission
    description: 'Claim submitted to carrier'
  },
  [CLAIM_STATE.CARRIER_RESPONSE_RECEIVED]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  // + carrier response
    description: 'Carrier response received'
  },
  [CLAIM_STATE.DISPUTE_IDENTIFIED]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: 'Dispute identified'
  },
  [CLAIM_STATE.SUPPLEMENT_PREPARED]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],  // + supplement
    description: 'Supplement prepared'
  },
  [CLAIM_STATE.RESUBMITTED]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    description: 'Supplement resubmitted'
  },
  [CLAIM_STATE.ESCALATION_CONSIDERED]: {
    requiredSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    description: 'Escalation being considered'
  },
  [CLAIM_STATE.CLOSED]: {
    requiredSteps: [],  // Can close at any point
    description: 'Claim closed'
  }
};

// ============================================================================
// STATE MACHINE FUNCTIONS
// ============================================================================

/**
 * Validates if a state transition is allowed
 * @param {string} currentState - Current claim state
 * @param {string} nextState - Proposed next state
 * @returns {Object} Validation result
 */
function validateTransition(currentState, nextState) {
  if (!CLAIM_STATE[currentState]) {
    return {
      valid: false,
      error: 'Invalid current state',
      currentState
    };
  }

  if (!CLAIM_STATE[nextState]) {
    return {
      valid: false,
      error: 'Invalid next state',
      nextState
    };
  }

  const allowedTransitions = STATE_TRANSITIONS[currentState] || [];
  const isAllowed = allowedTransitions.includes(nextState);

  return {
    valid: isAllowed,
    error: isAllowed ? null : 'Transition not allowed',
    currentState,
    nextState,
    allowedTransitions
  };
}

/**
 * Checks if required steps are completed for a state
 * @param {string} targetState - State to check
 * @param {Array<number>} completedSteps - Array of completed step numbers
 * @returns {Object} Readiness result
 */
function checkStateReadiness(targetState, completedSteps = []) {
  const requirements = STATE_STEP_REQUIREMENTS[targetState];
  
  if (!requirements) {
    return {
      ready: false,
      error: 'Invalid state',
      targetState
    };
  }

  const missingSteps = requirements.requiredSteps.filter(
    step => !completedSteps.includes(step)
  );

  return {
    ready: missingSteps.length === 0,
    targetState,
    requiredSteps: requirements.requiredSteps,
    completedSteps,
    missingSteps,
    description: requirements.description
  };
}

/**
 * Attempts to transition claim to new state
 * @param {Object} params - Transition parameters
 * @returns {Object} Transition result
 */
function transitionState(params) {
  const {
    currentState,
    nextState,
    completedSteps = [],
    userId,
    claimId,
    reason = ''
  } = params;

  // Validate transition is allowed
  const transitionValidation = validateTransition(currentState, nextState);
  if (!transitionValidation.valid) {
    return {
      success: false,
      error: transitionValidation.error,
      details: transitionValidation
    };
  }

  // Check if required steps are completed
  const readiness = checkStateReadiness(nextState, completedSteps);
  if (!readiness.ready) {
    return {
      success: false,
      error: 'Required steps not completed',
      details: readiness
    };
  }

  // Transition is valid
  return {
    success: true,
    transition: {
      from: currentState,
      to: nextState,
      timestamp: new Date().toISOString(),
      userId,
      claimId,
      reason,
      completedSteps
    },
    newState: nextState
  };
}

/**
 * Gets allowed next states for current state
 * @param {string} currentState - Current claim state
 * @param {Array<number>} completedSteps - Completed steps
 * @returns {Object} Available transitions
 */
function getAvailableTransitions(currentState, completedSteps = []) {
  const allowedStates = STATE_TRANSITIONS[currentState] || [];
  
  const transitions = allowedStates.map(state => {
    const readiness = checkStateReadiness(state, completedSteps);
    return {
      state,
      ready: readiness.ready,
      missingSteps: readiness.missingSteps,
      description: readiness.description
    };
  });

  return {
    currentState,
    availableTransitions: transitions,
    readyTransitions: transitions.filter(t => t.ready),
    blockedTransitions: transitions.filter(t => !t.ready)
  };
}

/**
 * Determines current state from completed steps
 * @param {Array<number>} completedSteps - Array of completed step numbers
 * @returns {string} Inferred claim state
 */
function inferStateFromSteps(completedSteps = []) {
  // Check states in order from most advanced to least
  // Return the most advanced state for which all requirements are met
  const stateOrder = [
    CLAIM_STATE.SUBMISSION_READY,  // Steps 1-10
    CLAIM_STATE.ESTIMATE_REVIEWED,  // Steps 1-5
    CLAIM_STATE.DOCUMENT_COLLECTION,  // Steps 1-3
    CLAIM_STATE.INTAKE  // No requirements
  ];

  for (const state of stateOrder) {
    const readiness = checkStateReadiness(state, completedSteps);
    if (readiness.ready) {
      return state;
    }
  }

  return CLAIM_STATE.INTAKE;
}

/**
 * Checks if a step is allowed in current state
 * @param {number} stepNumber - Step number to check
 * @param {string} currentState - Current claim state
 * @returns {Object} Step availability
 */
function isStepAllowed(stepNumber, currentState) {
  const requirements = STATE_STEP_REQUIREMENTS[currentState];
  
  if (!requirements) {
    return {
      allowed: false,
      error: 'Invalid state'
    };
  }

  // Allow any step up to the highest required step for current state
  const maxAllowedStep = Math.max(...requirements.requiredSteps, 0);
  const allowed = stepNumber <= maxAllowedStep + 1;  // Allow one step ahead

  return {
    allowed,
    stepNumber,
    currentState,
    maxAllowedStep,
    reason: allowed ? 'Step is accessible' : 'Complete previous steps first'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CLAIM_STATE,
    STATE_TRANSITIONS,
    STATE_STEP_REQUIREMENTS,
    validateTransition,
    checkStateReadiness,
    transitionState,
    getAvailableTransitions,
    inferStateFromSteps,
    isStepAllowed
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.ClaimStateMachine = {
    CLAIM_STATE,
    STATE_TRANSITIONS,
    STATE_STEP_REQUIREMENTS,
    validateTransition,
    checkStateReadiness,
    transitionState,
    getAvailableTransitions,
    inferStateFromSteps,
    isStepAllowed
  };
}


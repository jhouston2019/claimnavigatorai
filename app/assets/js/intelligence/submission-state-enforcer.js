/**
 * SUBMISSION STATE ENFORCER
 * Enforces claim state requirements for submission
 * 
 * HARD RULE: No submission possible unless claim state allows it
 * No UI bypass. No "just generate anyway."
 */

const { CLAIM_STATE, validateTransition } = require('./claim-state-machine');
const { evaluateSubmissionReadiness } = require('./submission-readiness-engine');
const { buildSubmissionPacket } = require('./submission-packet-builder');

// ============================================================================
// SUBMISSION ERRORS
// ============================================================================

class SubmissionBlockedError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SubmissionBlockedError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class SubmissionStateError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SubmissionStateError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// ============================================================================
// STATE VALIDATION
// ============================================================================

/**
 * Validates claim state allows submission
 * @param {string} claimState - Current claim state
 * @throws {SubmissionStateError} If state doesn't allow submission
 */
function validateSubmissionState(claimState) {
  const allowedStates = [
    CLAIM_STATE.SUBMISSION_READY,
    CLAIM_STATE.RESUBMITTED
  ];

  if (!allowedStates.includes(claimState)) {
    throw new SubmissionStateError(
      `Submission not allowed in state: ${claimState}`,
      {
        currentState: claimState,
        allowedStates,
        reason: 'Claim must be in SUBMISSION_READY or RESUBMITTED state'
      }
    );
  }
}

/**
 * Checks if claim can transition to submitted state
 * @param {string} currentState - Current claim state
 * @returns {boolean} True if transition is allowed
 */
function canSubmit(currentState) {
  // Only SUBMISSION_READY can transition to SUBMITTED
  // RESUBMITTED is already in a submitted state (it's a resubmission)
  if (currentState === CLAIM_STATE.SUBMISSION_READY) {
    const validation = validateTransition(currentState, CLAIM_STATE.SUBMITTED);
    return validation.valid;
  }

  // RESUBMITTED state means it's already been submitted (as a supplement)
  // So technically it "can submit" in the sense that it's submission-capable
  if (currentState === CLAIM_STATE.RESUBMITTED) {
    return true;
  }

  return false;
}

/**
 * Gets required actions to reach submission-ready state
 * @param {string} currentState - Current claim state
 * @param {Array} completedSteps - Completed steps
 * @returns {Array} Required actions
 */
function getRequiredActionsForSubmission(currentState, completedSteps = []) {
  const actions = [];

  // State-based requirements
  if (currentState === CLAIM_STATE.INTAKE) {
    actions.push('Complete intake process');
  }

  if (currentState === CLAIM_STATE.DOCUMENT_COLLECTION) {
    actions.push('Complete document collection');
  }

  if (currentState === CLAIM_STATE.ESTIMATE_REVIEWED) {
    actions.push('Complete all analysis steps');
  }

  // Step-based requirements
  const requiredSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));

  if (missingSteps.length > 0) {
    actions.push(`Complete steps: ${missingSteps.join(', ')}`);
  }

  // State transition requirement
  if (currentState !== CLAIM_STATE.SUBMISSION_READY && 
      currentState !== CLAIM_STATE.RESUBMITTED) {
    actions.push(`Transition claim to SUBMISSION_READY state`);
  }

  return actions;
}

// ============================================================================
// ENFORCED SUBMISSION
// ============================================================================

/**
 * Enforces state requirements and generates submission packet
 * @param {Object} params - Submission parameters
 * @returns {Object} Submission packet
 * @throws {SubmissionBlockedError} If submission not allowed
 */
function enforceAndSubmit(params) {
  const {
    claimId,
    claimState,
    completedSteps = [],
    documents = [],
    estimates = [],
    photos = [],
    policyDocs = [],
    priorCarrierDocs = [],
    contentsInventory = [],
    aleDocs = [],
    submissionType,
    claimNumber,
    policyNumber,
    dateOfLoss,
    estimateFindings = []
  } = params;

  // ENFORCEMENT 1: Validate claim state
  try {
    validateSubmissionState(claimState);
  } catch (error) {
    throw new SubmissionBlockedError(
      'Submission blocked: Invalid claim state',
      {
        error: error.message,
        details: error.details,
        claimId,
        claimState
      }
    );
  }

  // ENFORCEMENT 2: Evaluate readiness
  const readiness = evaluateSubmissionReadiness({
    claimState,
    completedSteps,
    estimates,
    photos,
    policyDocs,
    priorCarrierDocs,
    contentsInventory,
    aleDocs
  });

  if (!readiness.ready) {
    throw new SubmissionBlockedError(
      'Submission blocked: Claim not ready',
      {
        claimId,
        claimState,
        blockingIssues: readiness.blockingIssues,
        holdbacks: readiness.holdbacks,
        riskFlags: readiness.riskFlags,
        requiredActions: getRequiredActionsForSubmission(claimState, completedSteps)
      }
    );
  }

  // ENFORCEMENT 3: Build packet (with safety checks)
  const packet = buildSubmissionPacket({
    claimId,
    claimNumber,
    policyNumber,
    dateOfLoss,
    claimState,
    submissionType,
    documents,
    estimateFindings
  });

  // ENFORCEMENT 4: Validate packet
  const { validateSubmissionPacket } = require('./submission-packet-builder');
  const validation = validateSubmissionPacket(packet);

  if (!validation.valid) {
    throw new SubmissionBlockedError(
      'Submission blocked: Packet validation failed',
      {
        claimId,
        issues: validation.issues,
        warnings: validation.warnings
      }
    );
  }

  // Return packet with enforcement metadata
  return {
    ...packet,
    enforcementMetadata: {
      claimId,
      claimState,
      enforcedAt: new Date().toISOString(),
      readinessCheck: {
        ready: readiness.ready,
        blockingIssues: readiness.blockingIssues,
        holdbacks: readiness.holdbacks,
        riskFlags: readiness.riskFlags
      },
      stateValidation: {
        valid: true,
        allowedStates: [CLAIM_STATE.SUBMISSION_READY, CLAIM_STATE.RESUBMITTED]
      },
      packetValidation: {
        valid: validation.valid,
        issues: validation.issues,
        warnings: validation.warnings
      }
    }
  };
}

/**
 * Checks if submission is allowed (without throwing)
 * @param {Object} params - Check parameters
 * @returns {Object} Check result
 */
function checkSubmissionAllowed(params) {
  const {
    claimState,
    completedSteps = [],
    estimates = [],
    photos = [],
    policyDocs = [],
    priorCarrierDocs = [],
    contentsInventory = [],
    aleDocs = []
  } = params;

  const result = {
    allowed: false,
    reasons: [],
    requiredActions: []
  };

  // Check state
  try {
    validateSubmissionState(claimState);
  } catch (error) {
    result.reasons.push(error.message);
    result.requiredActions.push(...getRequiredActionsForSubmission(claimState, completedSteps));
    return result;
  }

  // Check readiness
  const readiness = evaluateSubmissionReadiness({
    claimState,
    completedSteps,
    estimates,
    photos,
    policyDocs,
    priorCarrierDocs,
    contentsInventory,
    aleDocs
  });

  if (!readiness.ready) {
    result.reasons.push(...readiness.blockingIssues);
    result.reasons.push(...readiness.holdbacks);
    result.requiredActions.push(...getRequiredActionsForSubmission(claimState, completedSteps));
    return result;
  }

  // All checks passed
  result.allowed = true;
  return result;
}

/**
 * Gets submission status for UI display
 * @param {Object} params - Status parameters
 * @returns {Object} Status information
 */
function getSubmissionStatus(params) {
  const check = checkSubmissionAllowed(params);

  return {
    canSubmit: check.allowed,
    status: check.allowed ? 'READY' : 'BLOCKED',
    reasons: check.reasons,
    requiredActions: check.requiredActions,
    claimState: params.claimState,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SubmissionBlockedError,
    SubmissionStateError,
    validateSubmissionState,
    canSubmit,
    getRequiredActionsForSubmission,
    enforceAndSubmit,
    checkSubmissionAllowed,
    getSubmissionStatus
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.SubmissionStateEnforcer = {
    SubmissionBlockedError,
    SubmissionStateError,
    validateSubmissionState,
    canSubmit,
    getRequiredActionsForSubmission,
    enforceAndSubmit,
    checkSubmissionAllowed,
    getSubmissionStatus
  };
}


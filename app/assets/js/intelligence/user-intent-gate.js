/**
 * USER INTENT GATE
 * Enforces explicit user confirmation before execution
 * 
 * CRITICAL CONSTRAINTS:
 * - Blocks ALL execution without confirmation
 * - Guidance/drafts do NOT require confirmation
 * - Execution (send, submit, escalate, state change) ALWAYS requires confirmation
 * - Pure function, deterministic
 */

// ============================================================================
// ACTION TYPES
// ============================================================================

const ACTION_TYPE = {
  // Execution actions (require confirmation)
  SEND_CORRESPONDENCE: 'SEND_CORRESPONDENCE',
  SUBMIT_CLAIM: 'SUBMIT_CLAIM',
  FILE_SUPPLEMENT: 'FILE_SUPPLEMENT',
  ESCALATE_CLAIM: 'ESCALATE_CLAIM',
  ADVANCE_STATE: 'ADVANCE_STATE',
  ACCEPT_OFFER: 'ACCEPT_OFFER',
  
  // Guidance actions (no confirmation required)
  GENERATE_GUIDANCE: 'GENERATE_GUIDANCE',
  GENERATE_DRAFT: 'GENERATE_DRAFT',
  ANALYZE_RESPONSE: 'ANALYZE_RESPONSE',
  VIEW_INTELLIGENCE: 'VIEW_INTELLIGENCE'
};

const CONFIRMATION_LEVEL = {
  NONE: 'NONE',           // Guidance/viewing only
  STANDARD: 'STANDARD',   // Normal execution
  CRITICAL: 'CRITICAL'    // High-impact actions
};

// ============================================================================
// INTENT VALIDATION
// ============================================================================

/**
 * Validates user intent before action
 * @param {Object} params - Validation parameters
 * @returns {Object} Validation result
 */
function validateUserIntent(params) {
  const {
    actionType,
    userIntent = {},
    actionContext = {}
  } = params;

  const validation = {
    allowed: false,
    requiresConfirmation: false,
    confirmationLevel: CONFIRMATION_LEVEL.NONE,
    blockingReasons: [],
    warnings: [],
    metadata: {
      actionType,
      validatedAt: new Date().toISOString()
    }
  };

  // Determine if action requires confirmation
  const confirmationRequired = requiresConfirmation(actionType);
  validation.requiresConfirmation = confirmationRequired;
  validation.confirmationLevel = getConfirmationLevel(actionType);

  // If no confirmation required, allow immediately
  if (!confirmationRequired) {
    validation.allowed = true;
    return validation;
  }

  // Validate confirmation for execution actions
  const confirmationValid = validateConfirmation(userIntent, actionType, actionContext);
  
  if (!confirmationValid.valid) {
    validation.blockingReasons = confirmationValid.reasons;
    validation.allowed = false;
  } else {
    validation.allowed = true;
    validation.warnings = confirmationValid.warnings;
  }

  return validation;
}

/**
 * Checks if action type requires confirmation
 * @param {string} actionType - Action type
 * @returns {boolean} True if confirmation required
 */
function requiresConfirmation(actionType) {
  const executionActions = [
    ACTION_TYPE.SEND_CORRESPONDENCE,
    ACTION_TYPE.SUBMIT_CLAIM,
    ACTION_TYPE.FILE_SUPPLEMENT,
    ACTION_TYPE.ESCALATE_CLAIM,
    ACTION_TYPE.ADVANCE_STATE,
    ACTION_TYPE.ACCEPT_OFFER
  ];

  return executionActions.includes(actionType);
}

/**
 * Gets confirmation level for action
 * @param {string} actionType - Action type
 * @returns {string} Confirmation level
 */
function getConfirmationLevel(actionType) {
  const criticalActions = [
    ACTION_TYPE.ACCEPT_OFFER,
    ACTION_TYPE.ESCALATE_CLAIM
  ];

  const standardActions = [
    ACTION_TYPE.SEND_CORRESPONDENCE,
    ACTION_TYPE.SUBMIT_CLAIM,
    ACTION_TYPE.FILE_SUPPLEMENT,
    ACTION_TYPE.ADVANCE_STATE
  ];

  if (criticalActions.includes(actionType)) {
    return CONFIRMATION_LEVEL.CRITICAL;
  } else if (standardActions.includes(actionType)) {
    return CONFIRMATION_LEVEL.STANDARD;
  }

  return CONFIRMATION_LEVEL.NONE;
}

/**
 * Validates user confirmation
 * @param {Object} userIntent - User intent object
 * @param {string} actionType - Action type
 * @param {Object} actionContext - Action context
 * @returns {Object} Validation result
 */
function validateConfirmation(userIntent, actionType, actionContext) {
  const result = {
    valid: false,
    reasons: [],
    warnings: []
  };

  // Check for confirmed flag
  if (!userIntent.confirmed) {
    result.reasons.push('User confirmation required but not provided');
    return result;
  }

  // Check for explicit action type match
  if (userIntent.actionType && userIntent.actionType !== actionType) {
    result.reasons.push(`Confirmation is for ${userIntent.actionType}, not ${actionType}`);
    return result;
  }

  // Check for timestamp (confirmation should be recent)
  if (userIntent.confirmedAt) {
    const confirmedTime = new Date(userIntent.confirmedAt);
    const now = new Date();
    const ageMinutes = (now - confirmedTime) / 1000 / 60;

    if (ageMinutes > 5) {
      result.warnings.push('Confirmation is more than 5 minutes old. Consider re-confirming.');
    }
  }

  // Check for review flag (user should have reviewed)
  if (!userIntent.reviewed && actionType === ACTION_TYPE.SEND_CORRESPONDENCE) {
    result.warnings.push('User has not marked correspondence as reviewed');
  }

  // Validation passed
  result.valid = true;
  return result;
}

/**
 * Creates confirmation request
 * @param {string} actionType - Action type
 * @param {Object} actionDetails - Action details
 * @returns {Object} Confirmation request
 */
function createConfirmationRequest(actionType, actionDetails = {}) {
  const request = {
    actionType,
    confirmationLevel: getConfirmationLevel(actionType),
    requiresConfirmation: requiresConfirmation(actionType),
    actionDetails,
    confirmationPrompt: getConfirmationPrompt(actionType, actionDetails),
    warnings: getActionWarnings(actionType, actionDetails),
    createdAt: new Date().toISOString()
  };

  return request;
}

/**
 * Gets confirmation prompt for action
 * @param {string} actionType - Action type
 * @param {Object} actionDetails - Action details
 * @returns {string} Confirmation prompt
 */
function getConfirmationPrompt(actionType, actionDetails) {
  const prompts = {
    [ACTION_TYPE.SEND_CORRESPONDENCE]: 'Are you sure you want to send this correspondence? Please review it carefully before confirming.',
    [ACTION_TYPE.SUBMIT_CLAIM]: 'Are you sure you want to submit this claim? Ensure all documentation is complete and accurate.',
    [ACTION_TYPE.FILE_SUPPLEMENT]: 'Are you sure you want to file this supplement request? Review all items and supporting documentation.',
    [ACTION_TYPE.ESCALATE_CLAIM]: 'Are you sure you want to escalate this claim? This is a significant step that may affect your relationship with the carrier.',
    [ACTION_TYPE.ADVANCE_STATE]: 'Are you sure you want to advance the claim state? This action cannot be easily undone.',
    [ACTION_TYPE.ACCEPT_OFFER]: 'Are you sure you want to accept this offer? Accepting may limit your ability to dispute later.'
  };

  return prompts[actionType] || 'Are you sure you want to proceed with this action?';
}

/**
 * Gets warnings for action
 * @param {string} actionType - Action type
 * @param {Object} actionDetails - Action details
 * @returns {Array} Warnings
 */
function getActionWarnings(actionType, actionDetails) {
  const warnings = [];

  if (actionType === ACTION_TYPE.SEND_CORRESPONDENCE) {
    warnings.push('Once sent, correspondence cannot be recalled.');
    warnings.push('Ensure all information is accurate and complete.');
    
    if (actionDetails.draftType === 'ESCALATION_LETTER') {
      warnings.push('Escalation letters may affect your relationship with the carrier.');
    }
  }

  if (actionType === ACTION_TYPE.ACCEPT_OFFER) {
    warnings.push('Accepting an offer may limit your ability to request additional compensation.');
    warnings.push('Consider consulting with a professional before accepting.');
  }

  if (actionType === ACTION_TYPE.ESCALATE_CLAIM) {
    warnings.push('Escalation is a significant step and should be used when other resolution attempts have failed.');
    warnings.push('Consider the potential impact on claim processing time.');
  }

  return warnings;
}

/**
 * Validates execution context
 * @param {Object} params - Context parameters
 * @returns {Object} Validation result
 */
function validateExecutionContext(params) {
  const {
    actionType,
    claimState,
    requiredDocuments = [],
    availableDocuments = []
  } = params;

  const validation = {
    valid: true,
    blockingIssues: [],
    warnings: []
  };

  // Check claim state allows action
  if (actionType === ACTION_TYPE.SUBMIT_CLAIM && claimState !== 'SUBMISSION_READY') {
    validation.valid = false;
    validation.blockingIssues.push(`Claim must be in SUBMISSION_READY state. Current state: ${claimState}`);
  }

  // Check required documents
  const missingDocs = requiredDocuments.filter(doc => 
    !availableDocuments.includes(doc)
  );

  if (missingDocs.length > 0) {
    validation.warnings.push(`Missing recommended documents: ${missingDocs.join(', ')}`);
  }

  return validation;
}

/**
 * Records user confirmation
 * @param {Object} params - Confirmation parameters
 * @returns {Object} Confirmation record
 */
function recordConfirmation(params) {
  const {
    actionType,
    userId,
    claimId,
    actionDetails = {}
  } = params;

  const record = {
    confirmationId: generateConfirmationId(),
    actionType,
    userId,
    claimId,
    actionDetails,
    confirmedAt: new Date().toISOString(),
    ipAddress: actionDetails.ipAddress || null,
    userAgent: actionDetails.userAgent || null
  };

  return record;
}

/**
 * Generates confirmation ID
 * @returns {string} Confirmation ID
 */
function generateConfirmationId() {
  return `CONF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if action is reversible
 * @param {string} actionType - Action type
 * @returns {boolean} True if reversible
 */
function isActionReversible(actionType) {
  const irreversibleActions = [
    ACTION_TYPE.SEND_CORRESPONDENCE,
    ACTION_TYPE.ACCEPT_OFFER
  ];

  return !irreversibleActions.includes(actionType);
}

/**
 * Gets action impact level
 * @param {string} actionType - Action type
 * @returns {string} Impact level
 */
function getActionImpact(actionType) {
  const highImpact = [
    ACTION_TYPE.ACCEPT_OFFER,
    ACTION_TYPE.ESCALATE_CLAIM
  ];

  const mediumImpact = [
    ACTION_TYPE.SEND_CORRESPONDENCE,
    ACTION_TYPE.SUBMIT_CLAIM,
    ACTION_TYPE.FILE_SUPPLEMENT
  ];

  if (highImpact.includes(actionType)) {
    return 'HIGH';
  } else if (mediumImpact.includes(actionType)) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Creates user intent object
 * @param {Object} params - Intent parameters
 * @returns {Object} User intent
 */
function createUserIntent(params) {
  const {
    actionType,
    confirmed = false,
    reviewed = false,
    userId = null
  } = params;

  return {
    confirmed,
    reviewed,
    actionType,
    confirmedAt: confirmed ? new Date().toISOString() : null,
    userId
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ACTION_TYPE,
    CONFIRMATION_LEVEL,
    validateUserIntent,
    requiresConfirmation,
    getConfirmationLevel,
    createConfirmationRequest,
    validateExecutionContext,
    recordConfirmation,
    isActionReversible,
    getActionImpact,
    createUserIntent
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.UserIntentGate = {
    ACTION_TYPE,
    CONFIRMATION_LEVEL,
    validateUserIntent,
    requiresConfirmation,
    getConfirmationLevel,
    createConfirmationRequest,
    validateExecutionContext,
    recordConfirmation,
    isActionReversible,
    getActionImpact,
    createUserIntent
  };
}


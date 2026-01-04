/**
 * SUBMISSION READINESS ENGINE
 * Determines if claim is safe and complete enough to submit
 * 
 * This engine answers:
 * - Is this claim ready to submit?
 * - What must NOT be submitted yet?
 * - What will weaken the claim if disclosed?
 * 
 * CRITICAL: No opinions, no suggestions, only factual conditions
 */

const { CLAIM_STATE } = require('./claim-state-machine');

// ============================================================================
// SUBMISSION TYPES
// ============================================================================

const SUBMISSION_TYPE = {
  INITIAL_CLAIM: 'INITIAL_CLAIM',
  SUPPLEMENT: 'SUPPLEMENT',
  ADDITIONAL_DOCUMENTATION: 'ADDITIONAL_DOCUMENTATION',
  RESPONSE_TO_REQUEST: 'RESPONSE_TO_REQUEST'
};

// ============================================================================
// READINESS EVALUATION
// ============================================================================

/**
 * Evaluates if claim is ready for submission
 * @param {Object} params - Evaluation parameters
 * @returns {Object} Readiness assessment
 */
function evaluateSubmissionReadiness(params) {
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

  const blockingIssues = [];
  const holdbacks = [];
  const riskFlags = [];
  const allowedSubmissionTypes = [];

  // RULE 1: Claim state must allow submission
  if (claimState !== CLAIM_STATE.SUBMISSION_READY && 
      claimState !== CLAIM_STATE.RESUBMITTED) {
    blockingIssues.push('Claim state does not allow submission');
  }

  // RULE 2: Required steps must be completed
  const requiredStepsForSubmission = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const missingSteps = requiredStepsForSubmission.filter(
    step => !completedSteps.includes(step)
  );
  
  if (missingSteps.length > 0) {
    blockingIssues.push(`Required steps not completed: ${missingSteps.join(', ')}`);
  }

  // RULE 3: Estimates must exist
  if (estimates.length === 0) {
    blockingIssues.push('No estimates provided');
  }

  // RULE 4: Check estimate completeness
  estimates.forEach((estimate, index) => {
    // Check for draft status
    if (estimate.status === 'draft' || estimate.isDraft) {
      blockingIssues.push(`Estimate ${index + 1} is marked as draft`);
    }

    // Check for partial scope indicators
    if (estimate.scope === 'partial' || estimate.isPartial) {
      blockingIssues.push(`Estimate ${index + 1} has partial scope`);
    }

    // Check for incomplete markers
    if (estimate.incomplete || estimate.status === 'incomplete') {
      blockingIssues.push(`Estimate ${index + 1} is marked incomplete`);
    }

    // Check for missing line items
    if (!estimate.lineItems || estimate.lineItems.length === 0) {
      blockingIssues.push(`Estimate ${index + 1} has no line items`);
    }
  });

  // RULE 5: Photos required if estimates exist
  if (estimates.length > 0 && photos.length === 0) {
    blockingIssues.push('Estimates exist but no photos provided');
  }

  // RULE 6: Policy documents required
  if (policyDocs.length === 0) {
    riskFlags.push('No policy documents uploaded');
  }

  // RULE 7: Contents inventory validation
  if (contentsInventory.length > 0) {
    // Check if inventory is complete
    const hasPhotos = contentsInventory.some(item => item.photos && item.photos.length > 0);
    if (!hasPhotos) {
      holdbacks.push('Contents inventory exists but lacks supporting photos');
    }

    // Check for incomplete valuations
    const hasIncompleteValuations = contentsInventory.some(
      item => !item.rcv || !item.acv
    );
    if (hasIncompleteValuations) {
      holdbacks.push('Contents inventory has incomplete valuations');
    }
  }

  // RULE 8: ALE documentation validation
  if (aleDocs.length > 0) {
    // Check for receipts
    const hasReceipts = aleDocs.some(doc => doc.type === 'receipt');
    if (!hasReceipts) {
      holdbacks.push('ALE claimed but no receipts provided');
    }

    // Check for incomplete expense documentation
    const hasIncomplete = aleDocs.some(doc => doc.status === 'incomplete');
    if (hasIncomplete) {
      holdbacks.push('ALE documentation incomplete');
    }
  }

  // RULE 9: Check for prior carrier documents
  if (priorCarrierDocs.length > 0) {
    // Flag if carrier has already responded
    riskFlags.push('Prior carrier documents exist - verify this is appropriate submission type');
  }

  // RULE 10: Determine allowed submission types
  if (claimState === CLAIM_STATE.SUBMISSION_READY && priorCarrierDocs.length === 0) {
    allowedSubmissionTypes.push(SUBMISSION_TYPE.INITIAL_CLAIM);
  }

  if (claimState === CLAIM_STATE.RESUBMITTED || priorCarrierDocs.length > 0) {
    allowedSubmissionTypes.push(SUBMISSION_TYPE.SUPPLEMENT);
    allowedSubmissionTypes.push(SUBMISSION_TYPE.ADDITIONAL_DOCUMENTATION);
  }

  if (priorCarrierDocs.some(doc => doc.type === 'request_for_information')) {
    allowedSubmissionTypes.push(SUBMISSION_TYPE.RESPONSE_TO_REQUEST);
  }

  // RULE 11: Check for user comments or notes
  const hasUserComments = estimates.some(est => est.userComments || est.notes);
  if (hasUserComments) {
    riskFlags.push('Estimates contain user comments - will be excluded from submission');
  }

  // RULE 12: Check for speculative content
  const hasSpeculative = estimates.some(est => 
    est.description && (
      est.description.toLowerCase().includes('might') ||
      est.description.toLowerCase().includes('could') ||
      est.description.toLowerCase().includes('possibly')
    )
  );
  if (hasSpeculative) {
    riskFlags.push('Speculative language detected - will be sanitized');
  }

  // Determine overall readiness
  const ready = blockingIssues.length === 0 && holdbacks.length === 0;

  return {
    ready,
    blockingIssues,
    holdbacks,
    riskFlags,
    allowedSubmissionTypes,
    metadata: {
      claimState,
      estimateCount: estimates.length,
      photoCount: photos.length,
      contentsItemCount: contentsInventory.length,
      aleDocCount: aleDocs.length,
      evaluatedAt: new Date().toISOString()
    }
  };
}

/**
 * Checks if specific document is safe to submit
 * @param {Object} document - Document to check
 * @returns {Object} Safety assessment
 */
function evaluateDocumentSafety(document) {
  const issues = [];
  const warnings = [];

  // Check document status
  if (document.status === 'draft') {
    issues.push('Document is marked as draft');
  }

  if (document.status === 'incomplete') {
    issues.push('Document is marked incomplete');
  }

  // Check for internal markers
  if (document.internal || document.isInternal) {
    issues.push('Document is marked for internal use only');
  }

  // Check for user annotations
  if (document.annotations || document.comments) {
    warnings.push('Document contains annotations - will be stripped');
  }

  // Check for AI-generated markers
  if (document.aiGenerated || document.source === 'ai') {
    warnings.push('Document is AI-generated - ensure review before submission');
  }

  // Check for prohibited content markers
  if (document.containsProhibitedLanguage) {
    issues.push('Document contains prohibited language');
  }

  const safe = issues.length === 0;

  return {
    safe,
    issues,
    warnings,
    document: {
      id: document.id,
      name: document.name,
      type: document.type
    }
  };
}

/**
 * Validates submission timing
 * @param {Object} params - Timing parameters
 * @returns {Object} Timing validation
 */
function validateSubmissionTiming(params) {
  const {
    claimState,
    lastSubmissionDate,
    carrierResponseDate,
    daysElapsed
  } = params;

  const issues = [];
  const warnings = [];

  // Check if too soon after last submission
  if (lastSubmissionDate) {
    const daysSinceSubmission = daysElapsed || 0;
    if (daysSinceSubmission < 7) {
      warnings.push('Less than 7 days since last submission');
    }
  }

  // Check if carrier response is pending
  if (claimState === CLAIM_STATE.SUBMITTED && !carrierResponseDate) {
    issues.push('Carrier response pending - wait for response before resubmitting');
  }

  // Check if resubmission without carrier response
  if (claimState === CLAIM_STATE.RESUBMITTED && !carrierResponseDate) {
    warnings.push('Resubmitting without documented carrier response');
  }

  const timingAppropriate = issues.length === 0;

  return {
    timingAppropriate,
    issues,
    warnings
  };
}

/**
 * Gets submission readiness summary
 * @param {Object} readiness - Readiness evaluation result
 * @returns {string} Human-readable summary
 */
function getReadinessSummary(readiness) {
  if (readiness.ready) {
    return 'Claim is ready for submission';
  }

  const parts = [];

  if (readiness.blockingIssues.length > 0) {
    parts.push(`${readiness.blockingIssues.length} blocking issue(s)`);
  }

  if (readiness.holdbacks.length > 0) {
    parts.push(`${readiness.holdbacks.length} item(s) should be held back`);
  }

  if (readiness.riskFlags.length > 0) {
    parts.push(`${readiness.riskFlags.length} risk flag(s)`);
  }

  return `Claim not ready: ${parts.join(', ')}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUBMISSION_TYPE,
    evaluateSubmissionReadiness,
    evaluateDocumentSafety,
    validateSubmissionTiming,
    getReadinessSummary
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.SubmissionReadinessEngine = {
    SUBMISSION_TYPE,
    evaluateSubmissionReadiness,
    evaluateDocumentSafety,
    validateSubmissionTiming,
    getReadinessSummary
  };
}


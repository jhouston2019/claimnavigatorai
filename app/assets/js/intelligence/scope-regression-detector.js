/**
 * SCOPE REGRESSION DETECTOR
 * Determines whether carrier response reduces scope relative to submission
 * 
 * CRITICAL CONSTRAINTS:
 * - Must reference concrete evidence
 * - No interpretation of intent
 * - No negotiation language
 * - No coverage interpretation
 */

// ============================================================================
// REGRESSION TYPES
// ============================================================================

const REGRESSION_TYPE = {
  LINE_ITEM_REMOVAL: 'LINE_ITEM_REMOVAL',
  CATEGORY_REMOVAL: 'CATEGORY_REMOVAL',
  QUANTITY_REDUCTION: 'QUANTITY_REDUCTION',
  MIXED: 'MIXED',
  NONE: 'NONE'
};

// ============================================================================
// REGRESSION DETECTION
// ============================================================================

/**
 * Detects scope regression
 * @param {Object} params - Detection parameters
 * @returns {Object} Regression analysis
 */
function detectScopeRegression(params) {
  const {
    submissionPacket,
    carrierResponse,
    estimateDelta
  } = params;

  const evidence = [];
  let regressionDetected = false;
  let regressionType = REGRESSION_TYPE.NONE;

  // Check if estimate delta shows regression
  if (estimateDelta && estimateDelta.scopeRegressionDetected) {
    regressionDetected = true;

    // Determine regression type based on delta
    const hasRemovals = estimateDelta.removedLineItems.length > 0;
    const hasReductions = estimateDelta.reducedQuantities.length > 0;
    const hasCategoryOmissions = estimateDelta.categoryOmissions.length > 0;

    // Count types of changes
    const changeTypes = [hasRemovals, hasReductions, hasCategoryOmissions].filter(Boolean).length;

    if (changeTypes > 1) {
      regressionType = REGRESSION_TYPE.MIXED;
      evidence.push('Multiple types of scope changes detected');
    } else if (hasRemovals) {
      regressionType = REGRESSION_TYPE.LINE_ITEM_REMOVAL;
    } else if (hasCategoryOmissions) {
      regressionType = REGRESSION_TYPE.CATEGORY_REMOVAL;
    } else if (hasReductions) {
      regressionType = REGRESSION_TYPE.QUANTITY_REDUCTION;
    }

    // Build evidence from delta
    if (estimateDelta.removedLineItems.length > 0) {
      estimateDelta.removedLineItems.forEach(item => {
        evidence.push(`Line item not present in carrier estimate: "${item.description}"`);
      });
    }

    if (estimateDelta.reducedQuantities.length > 0) {
      estimateDelta.reducedQuantities.forEach(item => {
        evidence.push(`Quantity reduced: "${item.description}" from ${item.before} to ${item.after}`);
      });
    }

    if (estimateDelta.categoryOmissions.length > 0) {
      estimateDelta.categoryOmissions.forEach(omission => {
        evidence.push(`Category not present: ${omission.category} (${omission.affectedItemCount} item(s))`);
      });
    }

    if (estimateDelta.valuationChangesPresent) {
      if (estimateDelta.metadata) {
        const originalTotal = estimateDelta.metadata.originalTotal || 0;
        const carrierTotal = estimateDelta.metadata.carrierTotal || 0;
        const difference = originalTotal - carrierTotal;
        
        if (difference > 0) {
          evidence.push(`Total valuation reduced by $${difference.toFixed(2)}`);
        }
      } else {
        evidence.push('Valuation changes detected');
      }
    }
  }

  // Check carrier response text for regression indicators
  if (carrierResponse && carrierResponse.carrierText) {
    const text = carrierResponse.carrierText.toLowerCase();
    
    const regressionIndicators = [
      { pattern: /not.*covered/i, evidence: 'Carrier indicated items not covered' },
      { pattern: /excluded/i, evidence: 'Carrier indicated items excluded' },
      { pattern: /removed/i, evidence: 'Carrier indicated items removed' },
      { pattern: /reduced/i, evidence: 'Carrier indicated scope reduced' },
      { pattern: /depreciation.*applied/i, evidence: 'Depreciation applied to items' },
      { pattern: /betterment/i, evidence: 'Betterment adjustment mentioned' }
    ];

    regressionIndicators.forEach(({ pattern, evidence: evidenceText }) => {
      if (pattern.test(text)) {
        evidence.push(evidenceText);
        regressionDetected = true;
      }
    });
  }

  // If regression detected but type not set, default to mixed
  if (regressionDetected && regressionType === REGRESSION_TYPE.NONE) {
    regressionType = REGRESSION_TYPE.MIXED;
  }

  return {
    regressionDetected,
    regressionType,
    evidence,
    metadata: {
      detectedAt: new Date().toISOString(),
      evidenceCount: evidence.length,
      deltaProvided: !!estimateDelta
    }
  };
}

/**
 * Gets regression severity
 * @param {Object} regression - Regression analysis
 * @returns {string} Severity level
 */
function getRegressionSeverity(regression) {
  if (!regression.regressionDetected) {
    return 'NONE';
  }

  const evidenceCount = regression.evidence.length;

  if (evidenceCount >= 5) {
    return 'HIGH';
  } else if (evidenceCount >= 3) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Gets regression description
 * @param {string} regressionType - Regression type
 * @returns {string} Description
 */
function getRegressionDescription(regressionType) {
  const descriptions = {
    [REGRESSION_TYPE.LINE_ITEM_REMOVAL]: 'Specific line items not present in carrier estimate',
    [REGRESSION_TYPE.CATEGORY_REMOVAL]: 'Entire categories not present in carrier estimate',
    [REGRESSION_TYPE.QUANTITY_REDUCTION]: 'Quantities reduced in carrier estimate',
    [REGRESSION_TYPE.MIXED]: 'Multiple types of scope changes in carrier estimate',
    [REGRESSION_TYPE.NONE]: 'No scope regression detected'
  };

  return descriptions[regressionType] || 'Unknown regression type';
}

/**
 * Validates regression detection
 * @param {Object} regression - Regression to validate
 * @returns {Object} Validation result
 */
function validateRegressionDetection(regression) {
  const issues = [];

  if (typeof regression.regressionDetected !== 'boolean') {
    issues.push('regressionDetected must be boolean');
  }

  if (!regression.regressionType) {
    issues.push('Missing regression type');
  }

  if (!Array.isArray(regression.evidence)) {
    issues.push('Evidence must be an array');
  }

  if (regression.regressionDetected && regression.evidence.length === 0) {
    issues.push('Regression detected but no evidence provided');
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
    REGRESSION_TYPE,
    detectScopeRegression,
    getRegressionSeverity,
    getRegressionDescription,
    validateRegressionDetection
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.ScopeRegressionDetector = {
    REGRESSION_TYPE,
    detectScopeRegression,
    getRegressionSeverity,
    getRegressionDescription,
    validateRegressionDetection
  };
}


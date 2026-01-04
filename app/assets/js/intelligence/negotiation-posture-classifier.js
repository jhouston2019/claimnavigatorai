/**
 * NEGOTIATION POSTURE CLASSIFIER
 * Classifies carrier's negotiation posture based on objective patterns
 * 
 * CRITICAL CONSTRAINTS:
 * - Pattern-based classification only
 * - No recommendations
 * - No strategy advice
 * - No coverage interpretation
 * - Neutral descriptions only
 */

// ============================================================================
// POSTURE TYPES
// ============================================================================

const POSTURE_TYPE = {
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  DELAY: 'DELAY',
  PARTIAL_ACCEPTANCE: 'PARTIAL_ACCEPTANCE',
  SCOPE_REDUCTION: 'SCOPE_REDUCTION',
  LOWBALL: 'LOWBALL',
  TECHNICAL_DENIAL: 'TECHNICAL_DENIAL',
  STALLING: 'STALLING'
};

const CONFIDENCE_LEVEL = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

// ============================================================================
// POSTURE DETECTION PATTERNS
// ============================================================================

const POSTURE_PATTERNS = {
  ADMINISTRATIVE: {
    patterns: [
      /received.*claim/i,
      /processing.*claim/i,
      /assigned.*adjuster/i,
      /claim.*number/i,
      /under.*review/i
    ],
    indicators: [
      'acknowledgment_only',
      'no_valuation_provided',
      'procedural_language'
    ]
  },

  DELAY: {
    patterns: [
      /additional.*time/i,
      /extended.*review/i,
      /more.*time.*needed/i,
      /investigation.*ongoing/i,
      /delay/i
    ],
    indicators: [
      'time_extension_requested',
      'no_substantive_response',
      'investigation_cited'
    ]
  },

  PARTIAL_ACCEPTANCE: {
    patterns: [
      /approved.*partial/i,
      /some.*items.*approved/i,
      /partial.*payment/i,
      /portion.*approved/i
    ],
    indicators: [
      'some_items_accepted',
      'some_items_rejected',
      'payment_less_than_requested'
    ]
  },

  SCOPE_REDUCTION: {
    patterns: [
      /not.*covered/i,
      /excluded/i,
      /removed.*line.*item/i,
      /reduced.*scope/i,
      /depreciation/i,
      /betterment/i
    ],
    indicators: [
      'line_items_removed',
      'categories_excluded',
      'scope_narrowed'
    ]
  },

  LOWBALL: {
    patterns: [
      /market.*value/i,
      /actual.*cash.*value/i,
      /depreciated.*value/i
    ],
    indicators: [
      'significant_valuation_reduction',
      'no_explanation_for_reduction',
      'below_market_valuation'
    ]
  },

  TECHNICAL_DENIAL: {
    patterns: [
      /policy.*does.*not.*cover/i,
      /exclusion.*applies/i,
      /not.*covered.*under/i,
      /policy.*language/i,
      /terms.*and.*conditions/i
    ],
    indicators: [
      'policy_language_cited',
      'exclusion_referenced',
      'coverage_denied'
    ]
  },

  STALLING: {
    patterns: [
      /additional.*information.*required/i,
      /need.*more.*documentation/i,
      /incomplete.*submission/i,
      /cannot.*proceed.*without/i
    ],
    indicators: [
      'repeated_information_requests',
      'previously_provided_items_requested',
      'vague_requirements'
    ]
  }
};

// ============================================================================
// POSTURE CLASSIFICATION
// ============================================================================

/**
 * Classifies carrier's negotiation posture
 * @param {Object} params - Classification parameters
 * @returns {Object} Posture classification
 */
function classifyNegotiationPosture(params) {
  const {
    carrierResponse,
    claimState,
    estimateDelta,
    scopeRegression
  } = params;

  const evidence = [];
  const scores = {};
  let confidence = CONFIDENCE_LEVEL.LOW;

  // Initialize scores
  Object.keys(POSTURE_TYPE).forEach(type => {
    scores[type] = 0;
  });

  // Extract carrier text
  const carrierText = carrierResponse?.carrierText || '';
  const responseType = carrierResponse?.responseType || '';

  // Pattern matching
  Object.entries(POSTURE_PATTERNS).forEach(([posture, config]) => {
    config.patterns.forEach(pattern => {
      if (pattern.test(carrierText)) {
        scores[posture]++;
        evidence.push(`Pattern detected: ${posture}`);
      }
    });
  });

  // Structural indicators from estimate delta
  if (estimateDelta) {
    if (estimateDelta.scopeRegressionDetected) {
      scores.SCOPE_REDUCTION += 2;
      evidence.push('Scope regression detected in estimate delta');
    }

    if (estimateDelta.valuationChangesPresent) {
      const originalTotal = estimateDelta.metadata?.originalTotal || 0;
      const carrierTotal = estimateDelta.metadata?.carrierTotal || 0;
      const reductionPercent = originalTotal > 0 
        ? ((originalTotal - carrierTotal) / originalTotal) * 100 
        : 0;

      if (reductionPercent > 50) {
        scores.LOWBALL += 2;
        evidence.push(`Valuation reduced by ${reductionPercent.toFixed(1)}%`);
      } else if (reductionPercent > 0) {
        scores.PARTIAL_ACCEPTANCE += 1;
        evidence.push(`Valuation reduced by ${reductionPercent.toFixed(1)}%`);
      }
    }

    if (estimateDelta.removedLineItems?.length > 0) {
      scores.SCOPE_REDUCTION += 1;
      evidence.push(`${estimateDelta.removedLineItems.length} line item(s) removed`);
    }
  }

  // Scope regression indicators
  if (scopeRegression?.regressionDetected) {
    scores.SCOPE_REDUCTION += 2;
    evidence.push(`Regression type: ${scopeRegression.regressionType}`);
  }

  // Response type indicators
  if (responseType === 'DELAY') {
    scores.DELAY += 3;
  } else if (responseType === 'REQUEST_FOR_INFORMATION') {
    scores.STALLING += 1;
  } else if (responseType === 'DENIAL') {
    scores.TECHNICAL_DENIAL += 3;
  } else if (responseType === 'ACKNOWLEDGMENT') {
    scores.ADMINISTRATIVE += 3;
  } else if (responseType === 'PARTIAL_APPROVAL') {
    scores.PARTIAL_ACCEPTANCE += 2;
  } else if (responseType === 'SCOPE_REDUCTION') {
    scores.SCOPE_REDUCTION += 3;
  }

  // Special case: LOWBALL requires both valuation changes AND quantity reductions
  if (estimateDelta?.valuationChangesPresent && estimateDelta?.reducedQuantities?.length >= 2) {
    scores.LOWBALL += 5;
    evidence.push('Multiple quantity reductions with valuation changes');
  }

  // Special case: PARTIAL_ACCEPTANCE when response type is partial but no major scope reduction
  if (responseType === 'PARTIAL_APPROVAL' && scopeRegression?.regressionDetected) {
    scores.PARTIAL_ACCEPTANCE += 2;
  }

  // Determine posture type based on highest score
  let postureType = POSTURE_TYPE.ADMINISTRATIVE;
  let maxScore = scores.ADMINISTRATIVE;

  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      postureType = type;
    }
  });

  // Determine confidence
  if (maxScore >= 4) {
    confidence = CONFIDENCE_LEVEL.HIGH;
  } else if (maxScore >= 2) {
    confidence = CONFIDENCE_LEVEL.MEDIUM;
  } else {
    confidence = CONFIDENCE_LEVEL.LOW;
  }

  // Generate neutral description
  const description = getNeutralPostureDescription(postureType, evidence);

  return {
    postureType,
    confidence,
    evidence,
    description,
    metadata: {
      classifiedAt: new Date().toISOString(),
      claimState,
      responseType,
      scores
    }
  };
}

/**
 * Gets neutral description of posture
 * @param {string} postureType - Posture type
 * @param {Array} evidence - Evidence array
 * @returns {string} Neutral description
 */
function getNeutralPostureDescription(postureType, evidence) {
  const descriptions = {
    [POSTURE_TYPE.ADMINISTRATIVE]: 'Carrier response is procedural/administrative in nature',
    [POSTURE_TYPE.DELAY]: 'Carrier has indicated need for additional time',
    [POSTURE_TYPE.PARTIAL_ACCEPTANCE]: 'Carrier has accepted some items and rejected others',
    [POSTURE_TYPE.SCOPE_REDUCTION]: 'Carrier has reduced scope from original submission',
    [POSTURE_TYPE.LOWBALL]: 'Carrier valuation differs significantly from submitted amount',
    [POSTURE_TYPE.TECHNICAL_DENIAL]: 'Carrier has cited policy language in denial',
    [POSTURE_TYPE.STALLING]: 'Carrier has requested additional information'
  };

  return descriptions[postureType] || 'Carrier posture classification uncertain';
}

/**
 * Checks if posture indicates dispute
 * @param {Object} classification - Posture classification
 * @returns {boolean} True if dispute indicated
 */
function indicatesDispute(classification) {
  const disputePostures = [
    POSTURE_TYPE.SCOPE_REDUCTION,
    POSTURE_TYPE.LOWBALL,
    POSTURE_TYPE.TECHNICAL_DENIAL
  ];

  return disputePostures.includes(classification.postureType);
}

/**
 * Checks if posture indicates delay
 * @param {Object} classification - Posture classification
 * @returns {boolean} True if delay indicated
 */
function indicatesDelay(classification) {
  const delayPostures = [
    POSTURE_TYPE.DELAY,
    POSTURE_TYPE.STALLING
  ];

  return delayPostures.includes(classification.postureType);
}

/**
 * Validates posture classification
 * @param {Object} classification - Classification to validate
 * @returns {Object} Validation result
 */
function validatePostureClassification(classification) {
  const issues = [];

  if (!classification.postureType) {
    issues.push('Missing posture type');
  }

  if (!classification.confidence) {
    issues.push('Missing confidence level');
  }

  if (!Array.isArray(classification.evidence)) {
    issues.push('Evidence must be an array');
  }

  if (!classification.description) {
    issues.push('Missing description');
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
    POSTURE_TYPE,
    CONFIDENCE_LEVEL,
    classifyNegotiationPosture,
    indicatesDispute,
    indicatesDelay,
    validatePostureClassification
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.NegotiationPostureClassifier = {
    POSTURE_TYPE,
    CONFIDENCE_LEVEL,
    classifyNegotiationPosture,
    indicatesDispute,
    indicatesDelay,
    validatePostureClassification
  };
}


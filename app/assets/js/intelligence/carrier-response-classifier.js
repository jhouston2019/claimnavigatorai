/**
 * CARRIER RESPONSE CLASSIFIER
 * Classifies carrier responses into canonical response types
 * 
 * CRITICAL CONSTRAINTS:
 * - Text-pattern driven only
 * - No assumptions
 * - No advice
 * - Explicit uncertainty where ambiguous
 * - No negotiation language
 * - No coverage interpretation
 */

// ============================================================================
// RESPONSE TYPE TAXONOMY
// ============================================================================

const RESPONSE_TYPE = {
  ACKNOWLEDGMENT: 'ACKNOWLEDGMENT',
  PARTIAL_APPROVAL: 'PARTIAL_APPROVAL',
  FULL_APPROVAL: 'FULL_APPROVAL',
  SCOPE_REDUCTION: 'SCOPE_REDUCTION',
  DENIAL: 'DENIAL',
  REQUEST_FOR_INFORMATION: 'REQUEST_FOR_INFORMATION',
  DELAY: 'DELAY',
  NON_RESPONSE: 'NON_RESPONSE'
};

const CONFIDENCE_LEVEL = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM'
};

// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * Text patterns for response type detection
 */
const RESPONSE_PATTERNS = {
  ACKNOWLEDGMENT: [
    /received.*claim/i,
    /acknowledge.*receipt/i,
    /claim.*number.*assigned/i,
    /under.*review/i,
    /reviewing.*claim/i,
    /assigned.*adjuster/i
  ],
  
  FULL_APPROVAL: [
    /approved.*full/i,
    /payment.*issued/i,
    /check.*enclosed/i,
    /settlement.*accepted/i,
    /agreed.*amount/i,
    /payment.*\$[\d,]+/i
  ],
  
  PARTIAL_APPROVAL: [
    /approved.*partial/i,
    /partial.*payment/i,
    /approved.*portion/i,
    /some.*items.*approved/i,
    /partial.*settlement/i
  ],
  
  SCOPE_REDUCTION: [
    /not.*covered/i,
    /excluded.*from.*coverage/i,
    /removed.*line.*item/i,
    /reduced.*scope/i,
    /not.*included/i,
    /depreciation.*applied/i,
    /betterment/i
  ],
  
  DENIAL: [
    /claim.*denied/i,
    /cannot.*approve/i,
    /not.*covered.*under.*policy/i,
    /denial.*letter/i,
    /rejected/i,
    /no.*coverage/i
  ],
  
  REQUEST_FOR_INFORMATION: [
    /additional.*information.*required/i,
    /please.*provide/i,
    /need.*documentation/i,
    /request.*additional/i,
    /more.*information.*needed/i,
    /submit.*following/i
  ],
  
  DELAY: [
    /additional.*time/i,
    /delay/i,
    /extended.*review/i,
    /require.*additional.*time/i,
    /investigation.*ongoing/i,
    /review.*has.*been.*extended/i
  ]
};

// ============================================================================
// CLASSIFICATION ENGINE
// ============================================================================

/**
 * Classifies carrier response
 * @param {Object} params - Classification parameters
 * @returns {Object} Classification result
 */
function classifyCarrierResponse(params) {
  const {
    carrierText = '',
    carrierEstimate = null,
    responseDocuments = []
  } = params;

  // Handle non-response case
  if (!carrierText && !carrierEstimate && responseDocuments.length === 0) {
    return {
      responseType: RESPONSE_TYPE.NON_RESPONSE,
      confidence: CONFIDENCE_LEVEL.HIGH,
      indicators: ['No carrier response received'],
      limitations: []
    };
  }

  const indicators = [];
  const limitations = [];
  const scores = {};

  // Initialize scores
  Object.keys(RESPONSE_TYPE).forEach(type => {
    scores[type] = 0;
  });

  // Pattern matching against carrier text
  if (carrierText) {
    Object.entries(RESPONSE_PATTERNS).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(carrierText)) {
          scores[type]++;
          const match = carrierText.match(pattern);
          if (match) {
            indicators.push(`Pattern detected: "${match[0].substring(0, 50)}..."`);
          }
        }
      });
    });
  }

  // Estimate presence increases confidence in certain types
  if (carrierEstimate) {
    // If carrier provided estimate, likely approval or scope reduction
    if (scores.FULL_APPROVAL > 0 || scores.PARTIAL_APPROVAL > 0) {
      scores.FULL_APPROVAL += 2;
      scores.PARTIAL_APPROVAL += 2;
      indicators.push('Carrier estimate provided');
    } else if (scores.SCOPE_REDUCTION > 0) {
      scores.SCOPE_REDUCTION += 2;
      indicators.push('Carrier estimate with scope changes');
    } else {
      // Estimate without clear approval text suggests partial approval
      scores.PARTIAL_APPROVAL += 1;
      indicators.push('Carrier estimate provided without explicit approval language');
      limitations.push('Classification based on estimate presence, not explicit text');
    }
  }

  // Document analysis
  responseDocuments.forEach(doc => {
    if (doc.type === 'payment' || doc.type === 'check') {
      scores.FULL_APPROVAL += 2;
      scores.PARTIAL_APPROVAL += 1;
      indicators.push('Payment document included');
    }
    
    if (doc.type === 'denial_letter') {
      scores.DENIAL += 3;
      indicators.push('Denial letter document present');
    }
    
    if (doc.type === 'information_request') {
      scores.REQUEST_FOR_INFORMATION += 3;
      indicators.push('Information request document present');
    }
  });

  // Determine response type based on highest score
  let responseType = RESPONSE_TYPE.ACKNOWLEDGMENT; // Default
  let maxScore = scores.ACKNOWLEDGMENT;
  let confidence = CONFIDENCE_LEVEL.MEDIUM;

  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      responseType = type;
    }
  });

  // Determine confidence
  if (maxScore >= 3) {
    confidence = CONFIDENCE_LEVEL.HIGH;
  } else if (maxScore === 0) {
    // No patterns matched
    responseType = RESPONSE_TYPE.ACKNOWLEDGMENT;
    confidence = CONFIDENCE_LEVEL.MEDIUM;
    indicators.push('No specific patterns detected, classified as acknowledgment');
    limitations.push('Insufficient text patterns for high-confidence classification');
  }

  // Handle ambiguous cases
  const topScores = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (topScores.length > 1 && topScores[0][1] === topScores[1][1]) {
    // Tie between multiple types
    confidence = CONFIDENCE_LEVEL.MEDIUM;
    limitations.push(`Ambiguous classification: ${topScores[0][0]} and ${topScores[1][0]} have equal scores`);
  }

  return {
    responseType,
    confidence,
    indicators,
    limitations,
    metadata: {
      classifiedAt: new Date().toISOString(),
      textLength: carrierText.length,
      hasEstimate: !!carrierEstimate,
      documentCount: responseDocuments.length,
      patternScores: scores
    }
  };
}

/**
 * Checks if response requires action
 * @param {Object} classification - Classification result
 * @returns {Object} Action requirement
 */
function requiresAction(classification) {
  const actionRequired = [
    RESPONSE_TYPE.REQUEST_FOR_INFORMATION,
    RESPONSE_TYPE.SCOPE_REDUCTION,
    RESPONSE_TYPE.PARTIAL_APPROVAL,
    RESPONSE_TYPE.DENIAL
  ].includes(classification.responseType);

  const actionType = {
    [RESPONSE_TYPE.REQUEST_FOR_INFORMATION]: 'PROVIDE_INFORMATION',
    [RESPONSE_TYPE.SCOPE_REDUCTION]: 'REVIEW_SCOPE_CHANGES',
    [RESPONSE_TYPE.PARTIAL_APPROVAL]: 'REVIEW_APPROVAL',
    [RESPONSE_TYPE.DENIAL]: 'REVIEW_DENIAL'
  }[classification.responseType] || 'NONE';

  return {
    actionRequired,
    actionType,
    urgency: classification.responseType === RESPONSE_TYPE.REQUEST_FOR_INFORMATION ? 'HIGH' : 'MEDIUM'
  };
}

/**
 * Gets response type description
 * @param {string} responseType - Response type
 * @returns {string} Description
 */
function getResponseTypeDescription(responseType) {
  const descriptions = {
    [RESPONSE_TYPE.ACKNOWLEDGMENT]: 'Carrier has acknowledged receipt of claim',
    [RESPONSE_TYPE.PARTIAL_APPROVAL]: 'Carrier has approved some items',
    [RESPONSE_TYPE.FULL_APPROVAL]: 'Carrier has approved claim',
    [RESPONSE_TYPE.SCOPE_REDUCTION]: 'Carrier has reduced scope from submission',
    [RESPONSE_TYPE.DENIAL]: 'Carrier has denied claim',
    [RESPONSE_TYPE.REQUEST_FOR_INFORMATION]: 'Carrier is requesting additional information',
    [RESPONSE_TYPE.DELAY]: 'Carrier has indicated processing delay',
    [RESPONSE_TYPE.NON_RESPONSE]: 'No carrier response received'
  };

  return descriptions[responseType] || 'Unknown response type';
}

/**
 * Validates classification result
 * @param {Object} classification - Classification to validate
 * @returns {Object} Validation result
 */
function validateClassification(classification) {
  const issues = [];

  if (!classification.responseType) {
    issues.push('Missing response type');
  }

  if (!classification.confidence) {
    issues.push('Missing confidence level');
  }

  if (!Array.isArray(classification.indicators)) {
    issues.push('Indicators must be an array');
  }

  if (classification.indicators.length === 0 && 
      classification.responseType !== RESPONSE_TYPE.NON_RESPONSE) {
    issues.push('No indicators provided for classification');
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
    RESPONSE_TYPE,
    CONFIDENCE_LEVEL,
    classifyCarrierResponse,
    requiresAction,
    getResponseTypeDescription,
    validateClassification
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.CarrierResponseClassifier = {
    RESPONSE_TYPE,
    CONFIDENCE_LEVEL,
    classifyCarrierResponse,
    requiresAction,
    getResponseTypeDescription,
    validateClassification
  };
}


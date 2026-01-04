/**
 * NEGOTIATION BOUNDARY ENFORCER
 * Hard guardrails against advice, negotiation, and entitlement framing
 * 
 * CRITICAL CONSTRAINTS:
 * - Block prohibited language
 * - Prevent advice generation
 * - Prevent coverage interpretation
 * - Prevent entitlement framing
 * - Prevent negotiation tactics
 * - Refuse with neutral explanation
 */

// ============================================================================
// BOUNDARY TYPES
// ============================================================================

const BOUNDARY_TYPE = {
  ADVICE_REQUEST: 'ADVICE_REQUEST',
  NEGOTIATION_TACTIC: 'NEGOTIATION_TACTIC',
  COVERAGE_INTERPRETATION: 'COVERAGE_INTERPRETATION',
  ENTITLEMENT_FRAMING: 'ENTITLEMENT_FRAMING',
  STRATEGY_REQUEST: 'STRATEGY_REQUEST'
};

// ============================================================================
// PROHIBITED PATTERNS
// ============================================================================

const PROHIBITED_PATTERNS = {
  ADVICE_REQUEST: [
    'what should i say',
    'what should i do',
    'what do i say',
    'what do i do',
    'how should i respond',
    'how do i respond',
    'what\'s the best way to',
    'should i tell them',
    'should i ask for'
  ],
  NEGOTIATION_TACTIC: [
    'how do i negotiate',
    'how to negotiate',
    'negotiation strategy',
    'how do i push back',
    'how to push back',
    'how do i counter',
    'how to counter',
    'what leverage do i have',
    'how do i pressure'
  ],
  COVERAGE_INTERPRETATION: [
    'are they required to',
    'do they have to',
    'are they obligated',
    'is this covered',
    'should this be covered',
    'does my policy cover',
    'am i covered for',
    'does coverage include'
  ],
  ENTITLEMENT_FRAMING: [
    'what am i owed',
    'what do they owe',
    'what should i get',
    'what am i entitled to',
    'what are they supposed to pay',
    'how much should i receive',
    'what\'s the right amount'
  ],
  STRATEGY_REQUEST: [
    'what\'s my next move',
    'what should my strategy be',
    'how do i win',
    'how do i get more',
    'what\'s the best approach',
    'how do i maximize',
    'what tactics should i use'
  ]
};

// ============================================================================
// BOUNDARY ENFORCEMENT
// ============================================================================

/**
 * Checks if request violates boundaries
 * @param {Object} params - Request parameters
 * @returns {Object} Boundary check result
 */
function checkBoundaries(params) {
  const {
    userRequest = '',
    context = {}
  } = params;

  const violations = [];
  const normalizedRequest = userRequest.toLowerCase().trim();

  // Check each boundary type
  Object.keys(PROHIBITED_PATTERNS).forEach(boundaryType => {
    const patterns = PROHIBITED_PATTERNS[boundaryType];
    
    patterns.forEach(pattern => {
      if (normalizedRequest.includes(pattern)) {
        violations.push({
          boundaryType,
          pattern,
          severity: 'HIGH'
        });
      }
    });
  });

  const allowed = violations.length === 0;

  return {
    allowed,
    violations,
    refusalReason: allowed ? null : generateRefusalReason(violations)
  };
}

/**
 * Generates neutral refusal reason
 * @param {Array} violations - Boundary violations
 * @returns {string} Refusal reason
 */
function generateRefusalReason(violations) {
  if (violations.length === 0) {
    return null;
  }

  const primaryViolation = violations[0];
  const boundaryType = primaryViolation.boundaryType;

  const refusalMessages = {
    ADVICE_REQUEST: 'This system provides factual intelligence only. It does not provide advice or recommendations.',
    NEGOTIATION_TACTIC: 'This system does not provide negotiation tactics or strategies.',
    COVERAGE_INTERPRETATION: 'This system does not interpret insurance coverage or policy obligations.',
    ENTITLEMENT_FRAMING: 'This system does not assess entitlement or determine amounts owed.',
    STRATEGY_REQUEST: 'This system does not provide strategic guidance or action recommendations.'
  };

  return refusalMessages[boundaryType] || 'This request violates system boundaries.';
}

/**
 * Validates output content for prohibited language
 * @param {string} outputText - Output to validate
 * @returns {Object} Validation result
 */
function validateOutputContent(outputText) {
  const prohibitedWords = [
    'should',
    'must',
    'need to',
    'have to',
    'recommend',
    'suggest',
    'advise',
    'negotiate',
    'demand',
    'entitled',
    'owed',
    'required to pay',
    'obligated to',
    'push back',
    'counter with',
    'leverage this',
    'use this to'
  ];

  const violations = [];
  const normalizedOutput = outputText.toLowerCase();

  prohibitedWords.forEach(word => {
    if (normalizedOutput.includes(word)) {
      violations.push({
        word,
        type: 'PROHIBITED_LANGUAGE'
      });
    }
  });

  const valid = violations.length === 0;

  return {
    valid,
    violations,
    blockReason: valid ? null : 'Output contains prohibited language'
  };
}

/**
 * Enforces boundaries on request
 * @param {Object} params - Request parameters
 * @returns {Object} Enforcement result
 */
function enforceBoundaries(params) {
  const boundaryCheck = checkBoundaries(params);

  if (!boundaryCheck.allowed) {
    return {
      allowed: false,
      refusalMessage: boundaryCheck.refusalReason,
      violations: boundaryCheck.violations,
      output: null
    };
  }

  return {
    allowed: true,
    refusalMessage: null,
    violations: [],
    output: null // Caller must generate output
  };
}

/**
 * Validates generated output
 * @param {string} output - Generated output
 * @returns {Object} Validation result
 */
function validateOutput(output) {
  const contentValidation = validateOutputContent(output);

  if (!contentValidation.valid) {
    return {
      valid: false,
      blockReason: contentValidation.blockReason,
      violations: contentValidation.violations
    };
  }

  return {
    valid: true,
    blockReason: null,
    violations: []
  };
}

/**
 * Gets boundary violation summary
 * @param {Array} violations - Violations
 * @returns {string} Summary
 */
function getViolationSummary(violations) {
  if (violations.length === 0) {
    return 'No violations detected';
  }

  const types = [...new Set(violations.map(v => v.boundaryType || v.type))];
  return `${violations.length} violation(s): ${types.join(', ')}`;
}

/**
 * Checks if text contains imperative language
 * @param {string} text - Text to check
 * @returns {boolean} True if imperatives detected
 */
function containsImperatives(text) {
  const imperativePatterns = [
    /\byou should\b/i,
    /\byou must\b/i,
    /\byou need to\b/i,
    /\byou have to\b/i,
    /\bi recommend\b/i,
    /\bi suggest\b/i,
    /\bi advise\b/i,
    /\bconsider\s+\w+ing\b/i,
    /\btry\s+\w+ing\b/i
  ];

  return imperativePatterns.some(pattern => pattern.test(text));
}

/**
 * Checks if text contains entitlement framing
 * @param {string} text - Text to check
 * @returns {boolean} True if entitlement detected
 */
function containsEntitlementFraming(text) {
  const entitlementPatterns = [
    /\byou are owed\b/i,
    /\byou are entitled\b/i,
    /\bthey owe you\b/i,
    /\bthey must pay\b/i,
    /\bthey are required to\b/i,
    /\bthey are obligated\b/i,
    /\byou deserve\b/i,
    /\byou should receive\b/i
  ];

  return entitlementPatterns.some(pattern => pattern.test(text));
}

/**
 * Comprehensive boundary check
 * @param {Object} params - Check parameters
 * @returns {Object} Check result
 */
function comprehensiveBoundaryCheck(params) {
  const {
    userRequest = '',
    generatedOutput = ''
  } = params;

  const requestCheck = checkBoundaries({ userRequest });
  const outputCheck = generatedOutput ? validateOutputContent(generatedOutput) : { valid: true, violations: [] };
  const imperativeCheck = generatedOutput ? containsImperatives(generatedOutput) : false;
  const entitlementCheck = generatedOutput ? containsEntitlementFraming(generatedOutput) : false;

  const allViolations = [
    ...requestCheck.violations,
    ...outputCheck.violations
  ];

  if (imperativeCheck) {
    allViolations.push({ type: 'IMPERATIVE_LANGUAGE' });
  }

  if (entitlementCheck) {
    allViolations.push({ type: 'ENTITLEMENT_FRAMING' });
  }

  const passed = allViolations.length === 0;

  return {
    passed,
    requestAllowed: requestCheck.allowed,
    outputValid: outputCheck.valid && !imperativeCheck && !entitlementCheck,
    violations: allViolations,
    refusalReason: requestCheck.refusalReason,
    summary: getViolationSummary(allViolations)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BOUNDARY_TYPE,
    PROHIBITED_PATTERNS,
    checkBoundaries,
    validateOutputContent,
    enforceBoundaries,
    validateOutput,
    getViolationSummary,
    containsImperatives,
    containsEntitlementFraming,
    comprehensiveBoundaryCheck
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.NegotiationBoundaryEnforcer = {
    BOUNDARY_TYPE,
    PROHIBITED_PATTERNS,
    checkBoundaries,
    validateOutputContent,
    enforceBoundaries,
    validateOutput,
    getViolationSummary,
    containsImperatives,
    containsEntitlementFraming,
    comprehensiveBoundaryCheck
  };
}


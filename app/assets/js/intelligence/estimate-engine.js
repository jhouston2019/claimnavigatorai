/**
 * ESTIMATE INTELLIGENCE ENGINE
 * Canonical estimate analysis logic extracted from Estimate Review Pro
 * 
 * This engine provides:
 * - Estimate classification (Property/Auto/Commercial)
 * - Line item analysis
 * - Scope gap detection
 * - Under-scoping identification
 * - Neutral findings generation
 * 
 * CRITICAL: This is headless logic only. No UI, no DOM, no CSS.
 * All behavior preserved exactly from Estimate Review Pro.
 */

// ============================================================================
// CLASSIFICATION ENGINE
// ============================================================================

const PROPERTY_KEYWORDS = [
  'roofing', 'roof', 'shingles', 'siding', 'drywall', 'flooring',
  'painting', 'water damage', 'fire damage', 'wind damage', 'hail damage',
  'interior', 'exterior', 'foundation', 'hvac', 'plumbing', 'electrical',
  'kitchen', 'bathroom', 'bedroom', 'living room', 'ceiling', 'wall',
  'insulation', 'gutters', 'windows', 'doors', 'deck', 'fence'
];

const AUTO_KEYWORDS = [
  'bumper', 'fender', 'hood', 'door panel', 'quarter panel', 'trunk',
  'windshield', 'headlight', 'taillight', 'mirror', 'grille', 'paint',
  'body shop', 'collision', 'frame', 'suspension', 'alignment',
  'airbag', 'seat', 'dashboard', 'wheel', 'tire', 'rim'
];

const COMMERCIAL_KEYWORDS = [
  'commercial property', 'business', 'retail', 'office', 'warehouse',
  'industrial', 'manufacturing', 'restaurant', 'store', 'building',
  'tenant improvement', 'ada compliance', 'fire suppression', 'sprinkler',
  'commercial kitchen', 'loading dock', 'parking lot', 'signage'
];

/**
 * Classifies estimate by type
 * @param {string} text - Full estimate text
 * @param {Array<string>} lineItems - Array of line item strings
 * @returns {Object} Classification result
 */
function classifyEstimate(text, lineItems) {
  const content = (text || '') + ' ' + (lineItems || []).join(' ');
  const contentLower = content.toLowerCase();

  // Count keyword matches
  const propertyScore = PROPERTY_KEYWORDS.filter(kw => 
    contentLower.includes(kw)
  ).length;

  const autoScore = AUTO_KEYWORDS.filter(kw => 
    contentLower.includes(kw)
  ).length;

  const commercialScore = COMMERCIAL_KEYWORDS.filter(kw => 
    contentLower.includes(kw)
  ).length;

  const scores = {
    property: propertyScore,
    auto: autoScore,
    commercial: commercialScore
  };

  const maxScore = Math.max(propertyScore, autoScore, commercialScore);

  // Reject if no clear classification (minimum 3 keywords required)
  if (maxScore < 3) {
    return {
      success: false,
      error: 'Unable to classify estimate type',
      reason: 'Insufficient recognizable line items',
      classification: 'UNKNOWN',
      scores
    };
  }

  // Reject if ambiguous (two types within 2 points of each other)
  const sortedScores = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
  
  if (sortedScores[0][1] - sortedScores[1][1] < 2) {
    return {
      success: false,
      error: 'Ambiguous estimate type',
      reason: 'Multiple estimate types detected',
      classification: 'AMBIGUOUS',
      scores
    };
  }

  // Determine final classification
  let classification;
  if (propertyScore === maxScore) {
    classification = 'PROPERTY';
  } else if (autoScore === maxScore) {
    classification = 'AUTO';
  } else {
    classification = 'COMMERCIAL';
  }

  return {
    success: true,
    classification,
    confidence: maxScore >= 5 ? 'HIGH' : 'MEDIUM',
    scores
  };
}

// ============================================================================
// LINE ITEM ANALYSIS ENGINE
// ============================================================================

// Expected categories for each estimate type
const EXPECTED_CATEGORIES = {
  PROPERTY: {
    ROOFING: ['shingles', 'underlayment', 'flashing', 'ridge cap', 'starter strip', 'ice & water shield', 'ventilation'],
    SIDING: ['siding material', 'house wrap', 'trim', 'corner posts', 'j-channel'],
    INTERIOR: ['drywall', 'paint', 'flooring', 'baseboards', 'doors', 'trim'],
    WATER_DAMAGE: ['water extraction', 'drying', 'dehumidification', 'antimicrobial', 'moisture testing'],
    DEMOLITION: ['tear out', 'removal', 'disposal', 'dumpster'],
    LABOR: ['installation', 'labor', 'contractor overhead', 'profit']
  },
  AUTO: {
    BODY: ['panel replacement', 'panel repair', 'bumper', 'fender', 'door', 'quarter panel'],
    PAINT: ['paint materials', 'clear coat', 'primer', 'paint labor', 'blend'],
    MECHANICAL: ['alignment', 'suspension', 'frame', 'structural'],
    PARTS: ['oem parts', 'aftermarket parts', 'hardware', 'fasteners'],
    LABOR: ['body labor', 'paint labor', 'mechanical labor', 'refinish labor']
  },
  COMMERCIAL: {
    STRUCTURAL: ['framing', 'foundation', 'roof structure', 'walls'],
    SYSTEMS: ['hvac', 'electrical', 'plumbing', 'fire suppression'],
    INTERIOR: ['drywall', 'flooring', 'ceiling', 'doors', 'trim'],
    EXTERIOR: ['roofing', 'siding', 'windows', 'doors', 'parking lot'],
    COMPLIANCE: ['ada compliance', 'code upgrades', 'permits', 'inspections'],
    LABOR: ['general contractor', 'subcontractors', 'overhead', 'profit']
  }
};

// Common under-scoping patterns
const UNDER_SCOPING_PATTERNS = {
  ZERO_QUANTITY: /quantity[:\s]*0|qty[:\s]*0|^0\s+/i,
  MISSING_LABOR: /material only|materials only|parts only/i,
  INCOMPLETE_SCOPE: /partial|incomplete|temporary|patch/i
};

/**
 * Analyzes line items for completeness and issues
 * @param {Array<string|Object>} lineItems - Line items to analyze
 * @param {string} classification - Estimate classification
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Analysis results
 */
function analyzeLineItems(lineItems, classification, metadata = {}) {
  if (!lineItems || !Array.isArray(lineItems)) {
    return {
      success: false,
      error: 'Missing or invalid lineItems array'
    };
  }

  if (!classification || !EXPECTED_CATEGORIES[classification]) {
    return {
      success: false,
      error: 'Invalid or missing classification',
      validTypes: Object.keys(EXPECTED_CATEGORIES)
    };
  }

  // Analysis results
  const analysis = {
    totalLineItems: lineItems.length,
    includedCategories: [],
    missingCategories: [],
    zeroQuantityItems: [],
    potentialUnderScoping: [],
    observations: []
  };

  // Convert line items to searchable text
  const lineItemsText = lineItems.map(item => {
    if (typeof item === 'string') return item.toLowerCase();
    if (typeof item === 'object') {
      return JSON.stringify(item).toLowerCase();
    }
    return '';
  }).join(' ');

  // Check for expected categories
  const expectedCats = EXPECTED_CATEGORIES[classification];
  
  for (const [categoryName, keywords] of Object.entries(expectedCats)) {
    const found = keywords.some(keyword => 
      lineItemsText.includes(keyword.toLowerCase())
    );

    if (found) {
      analysis.includedCategories.push({
        category: categoryName,
        status: 'PRESENT'
      });
    } else {
      analysis.missingCategories.push({
        category: categoryName,
        status: 'NOT_FOUND',
        note: 'This category was not detected in the estimate'
      });
    }
  }

  // Check each line item for issues
  lineItems.forEach((item, index) => {
    const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
    const itemLower = itemStr.toLowerCase();

    // Check for zero quantity
    if (UNDER_SCOPING_PATTERNS.ZERO_QUANTITY.test(itemStr)) {
      analysis.zeroQuantityItems.push({
        lineNumber: index + 1,
        description: itemStr.substring(0, 100),
        issue: 'Zero quantity detected'
      });
    }

    // Check for missing labor
    if (UNDER_SCOPING_PATTERNS.MISSING_LABOR.test(itemLower)) {
      analysis.potentialUnderScoping.push({
        lineNumber: index + 1,
        description: itemStr.substring(0, 100),
        issue: 'Material-only line item (no labor component mentioned)'
      });
    }

    // Check for incomplete scope indicators
    if (UNDER_SCOPING_PATTERNS.INCOMPLETE_SCOPE.test(itemLower)) {
      analysis.potentialUnderScoping.push({
        lineNumber: index + 1,
        description: itemStr.substring(0, 100),
        issue: 'Scope may be incomplete or temporary'
      });
    }
  });

  // Generate neutral observations
  if (analysis.missingCategories.length > 0) {
    analysis.observations.push(
      `${analysis.missingCategories.length} expected category(ies) not detected in estimate`
    );
  }

  if (analysis.zeroQuantityItems.length > 0) {
    analysis.observations.push(
      `${analysis.zeroQuantityItems.length} line item(s) with zero quantity`
    );
  }

  if (analysis.potentialUnderScoping.length > 0) {
    analysis.observations.push(
      `${analysis.potentialUnderScoping.length} line item(s) with potential scope limitations`
    );
  }

  if (analysis.observations.length === 0) {
    analysis.observations.push(
      'No obvious omissions or under-scoping detected'
    );
  }

  return {
    success: true,
    classification,
    analysis,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// OUTPUT FORMATTING ENGINE
// ============================================================================

/**
 * Formats analysis into neutral findings report
 * @param {Object} analysis - Analysis results
 * @param {string} classification - Estimate classification
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted report
 */
function formatOutput(analysis, classification, metadata = {}) {
  if (!analysis) {
    return {
      success: false,
      error: 'Missing analysis data'
    };
  }

  // Build neutral findings report
  const report = {
    title: 'Estimate Review Findings',
    generated: new Date().toISOString(),
    classification: classification || 'UNKNOWN',
    
    summary: buildSummary(analysis),
    includedItems: buildIncludedItems(analysis),
    potentialOmissions: buildPotentialOmissions(analysis),
    potentialUnderScoping: buildPotentialUnderScoping(analysis),
    limitations: buildLimitations(),
    
    metadata: {
      totalLineItems: analysis.totalLineItems || 0,
      categoriesFound: analysis.includedCategories?.length || 0,
      categoriesMissing: analysis.missingCategories?.length || 0,
      issuesDetected: (analysis.zeroQuantityItems?.length || 0) + 
                     (analysis.potentialUnderScoping?.length || 0)
    }
  };

  return {
    success: true,
    report
  };
}

function buildSummary(analysis) {
  const lines = [];
  
  lines.push('ESTIMATE STRUCTURE REVIEW');
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('');
  lines.push('AUTOMATED OBSERVATIONAL ANALYSIS');
  lines.push('This is an automated, observational estimate analysis.');
  lines.push('No coverage, pricing, or entitlement determinations are made.');
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('');
  lines.push(`This report identifies ${analysis.totalLineItems || 0} line items in the submitted estimate.`);
  lines.push('');
  
  if (analysis.observations && analysis.observations.length > 0) {
    lines.push('Key Observations:');
    analysis.observations.forEach(obs => {
      lines.push(`• ${obs}`);
    });
  } else {
    lines.push('No significant observations noted.');
  }
  
  lines.push('');
  lines.push('This is a factual review only. It does not constitute advice, recommendations, or opinions on coverage, pricing, or claim strategy.');
  
  return lines.join('\n');
}

function buildIncludedItems(analysis) {
  const lines = [];
  
  lines.push('DETECTED TRADES');
  lines.push('');
  lines.push('The following categories were detected in the estimate:');
  lines.push('');
  
  if (analysis.includedCategories && analysis.includedCategories.length > 0) {
    analysis.includedCategories.forEach(cat => {
      lines.push(`• ${cat.category}`);
    });
  } else {
    lines.push('• No standard categories detected');
  }
  
  return lines.join('\n');
}

function buildPotentialOmissions(analysis) {
  const lines = [];
  
  lines.push('CATEGORIES NOT DETECTED');
  lines.push('');
  lines.push('The following categories were NOT detected in the estimate:');
  lines.push('');
  
  if (analysis.missingCategories && analysis.missingCategories.length > 0) {
    analysis.missingCategories.forEach(cat => {
      lines.push(`• ${cat.category}`);
      if (cat.note) {
        lines.push(`  Note: ${cat.note}`);
      }
    });
    lines.push('');
    lines.push('CRITICAL DISCLAIMER: Absence from this estimate does not indicate these items are required, covered, owed, or applicable to your specific claim. This is a factual observation only. Categories not detected may be intentionally excluded, not applicable, or not covered under the policy.');
  } else {
    lines.push('• All expected categories detected');
  }
  
  return lines.join('\n');
}

function buildPotentialUnderScoping(analysis) {
  const lines = [];
  
  lines.push('LINE ITEM OBSERVATIONS');
  lines.push('');
  
  const allIssues = [
    ...(analysis.zeroQuantityItems || []),
    ...(analysis.potentialUnderScoping || [])
  ];
  
  if (allIssues.length > 0) {
    lines.push('The following line items have structural observations:');
    lines.push('');
    
    allIssues.forEach(issue => {
      lines.push(`Line ${issue.lineNumber}:`);
      lines.push(`  Description: ${issue.description}`);
      lines.push(`  Observation: ${issue.issue}`);
      lines.push('');
    });
    
    lines.push('CRITICAL DISCLAIMER: These are factual observations based on the line item text. They do not constitute opinions on what should be included, paid, covered, or owed. These observations do not indicate carrier error, under-payment, or policy violations.');
  } else {
    lines.push('No structural observations noted.');
  }
  
  return lines.join('\n');
}

function buildLimitations() {
  const lines = [];
  
  lines.push('LIMITATIONS OF THIS REVIEW');
  lines.push('');
  lines.push('This review is subject to the following limitations:');
  lines.push('');
  lines.push('• This is a text-based analysis only. No physical inspection was performed.');
  lines.push('• This review does not interpret insurance policy coverage or exclusions.');
  lines.push('• This review does not provide opinions on pricing, rates, or cost reasonableness.');
  lines.push('• This review does not constitute advice on claim strategy or negotiations.');
  lines.push('• Missing items may not be applicable, required, or covered under your policy.');
  lines.push('• This review does not replace professional inspection or expert consultation.');
  lines.push('• Results depend on the quality and completeness of the submitted estimate.');
  lines.push('');
  lines.push('For coverage questions, consult your insurance policy or agent.');
  lines.push('For technical questions, consult a licensed contractor or engineer.');
  lines.push('For legal questions, consult an attorney.');
  
  return lines.join('\n');
}

// ============================================================================
// GUARDRAILS ENGINE
// ============================================================================

// Prohibited phrases that trigger immediate rejection
const PROHIBITED_PHRASES = [
  // Payment/Entitlement language
  'should be paid', 'must pay', 'owed to', 'entitled to', 'deserve', 'compensation for',
  
  // Legal/Bad faith language
  'bad faith', 'breach of contract', 'sue', 'lawsuit', 'attorney', 'lawyer', 'legal action', 'litigation',
  
  // Negotiation/Dispute language
  'demand', 'insist', 'require payment', 'force them', 'make them pay', 'fight', 'dispute', 'argue', 'negotiate',
  
  // Coverage interpretation
  'coverage should', 'policy requires', 'they have to', 'obligation to pay', 'contractual duty',
  
  // Unfair/Bias language
  'unfair', 'cheating', 'lowball', 'ripping off', 'scam', 'fraud'
];

// Prohibited request types
const PROHIBITED_REQUESTS = [
  'write a demand letter', 'draft a complaint', 'help me negotiate', 'what should i say',
  'how do i argue', 'prove they\'re wrong', 'fight this estimate', 'dispute this',
  'challenge the adjuster', 'interpret my policy', 'what does my policy say',
  'am i covered', 'should this be covered', 'coverage question', 'legal advice', 'what are my rights'
];

/**
 * Checks content against safety guardrails
 * @param {string} text - Main text content
 * @param {string} userInput - User input text
 * @param {Array<string>} lineItems - Line items
 * @returns {Object} Guardrail check result
 */
function checkGuardrails(text, userInput, lineItems) {
  const lineItemsText = (lineItems || []).join(' ');
  const content = (text || '') + ' ' + (userInput || '') + ' ' + lineItemsText;
  const contentLower = content.toLowerCase();

  // Check for prohibited phrases
  const foundProhibitedPhrases = PROHIBITED_PHRASES.filter(phrase =>
    contentLower.includes(phrase)
  );

  if (foundProhibitedPhrases.length > 0) {
    return {
      success: false,
      error: 'Prohibited content detected',
      reason: 'This system provides neutral estimate analysis only',
      violations: foundProhibitedPhrases,
      message: 'This tool does not provide negotiation assistance, coverage interpretation, or legal advice. It only identifies potential omissions or under-scoping in estimates.'
    };
  }

  // Check for prohibited request types
  const foundProhibitedRequests = PROHIBITED_REQUESTS.filter(request =>
    contentLower.includes(request)
  );

  if (foundProhibitedRequests.length > 0) {
    return {
      success: false,
      error: 'Prohibited request detected',
      reason: 'This system does not handle this type of request',
      violations: foundProhibitedRequests,
      message: 'This tool provides factual estimate review only. For coverage questions, consult your policy. For legal matters, consult an attorney. For negotiations, work directly with your carrier or hire a public adjuster.'
    };
  }

  // Additional pattern detection for sneaky attempts
  const suspiciousPatterns = [
    /how (do|can) i (get|make|force)/i,
    /they (should|must|need to|have to) pay/i,
    /what (should|can) i (say|tell|write)/i,
    /help me (fight|argue|dispute|negotiate)/i,
    /am i (entitled|owed|covered)/i
  ];

  const foundSuspiciousPatterns = suspiciousPatterns.filter(pattern =>
    pattern.test(content)
  );

  if (foundSuspiciousPatterns.length > 0) {
    return {
      success: false,
      error: 'Request outside system scope',
      reason: 'This system provides neutral estimate analysis only',
      message: 'This tool identifies potential omissions in estimates. It does not provide advice on negotiations, coverage, or claim strategy.'
    };
  }

  // Content passes all guardrails
  return {
    success: true,
    status: 'APPROVED',
    message: 'Content passes safety guardrails'
  };
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main analysis function - orchestrates full estimate analysis
 * @param {Object} input - Input parameters
 * @returns {Object} Complete analysis result
 */
function analyzeEstimate(input) {
  const {
    estimateText = '',
    lineItems = [],
    userInput = '',
    metadata = {}
  } = input;

  // Parse line items if not provided
  let parsedLineItems = lineItems;
  if (!parsedLineItems || parsedLineItems.length === 0) {
    parsedLineItems = parseLineItems(estimateText);
  }

  // STEP 1: Run guardrails check
  const guardrailsResult = checkGuardrails(estimateText, userInput, parsedLineItems);
  if (!guardrailsResult.success) {
    return {
      success: false,
      error: guardrailsResult.error,
      details: guardrailsResult
    };
  }

  // STEP 2: Classify estimate type
  const classificationResult = classifyEstimate(estimateText, parsedLineItems);
  if (!classificationResult.success) {
    return {
      success: false,
      error: classificationResult.error,
      details: classificationResult
    };
  }

  const classification = classificationResult.classification;

  // STEP 3: Analyze line items
  const analysisResult = analyzeLineItems(parsedLineItems, classification, metadata);
  if (!analysisResult.success) {
    return {
      success: false,
      error: analysisResult.error,
      details: analysisResult
    };
  }

  // STEP 4: Format output
  const formattingResult = formatOutput(analysisResult.analysis, classification, metadata);
  if (!formattingResult.success) {
    return {
      success: false,
      error: formattingResult.error,
      details: formattingResult
    };
  }

  // Return complete analysis
  return {
    success: true,
    status: 'SUCCESS',
    classification: classificationResult,
    analysis: analysisResult.analysis,
    report: formattingResult.report,
    timestamp: new Date().toISOString()
  };
}

/**
 * Parse line items from text
 * @param {string} text - Estimate text
 * @returns {Array<string>} Parsed line items
 */
function parseLineItems(text) {
  if (!text) return [];
  
  const lines = text.split('\n');
  const lineItems = [];
  
  // Simple heuristic: lines that look like estimate items
  const itemPattern = /(\d+|[A-Z][a-z]+\s+[A-Z][a-z]+|\$\d+)/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && itemPattern.test(trimmed)) {
      lineItems.push(trimmed);
    }
  }
  
  return lineItems;
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    analyzeEstimate,
    classifyEstimate,
    analyzeLineItems,
    formatOutput,
    checkGuardrails,
    parseLineItems
  };
}

// For Browser (Frontend)
if (typeof window !== 'undefined') {
  window.EstimateEngine = {
    analyzeEstimate,
    classifyEstimate,
    analyzeLineItems,
    formatOutput,
    checkGuardrails,
    parseLineItems
  };
}


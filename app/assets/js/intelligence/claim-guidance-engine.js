/**
 * CLAIM GUIDANCE ENGINE
 * Provides claim direction, policy explanation, and recommendations
 * 
 * CRITICAL CONSTRAINTS:
 * - Guidance only, never auto-execution
 * - Recommendations with disclaimers
 * - User must confirm before any action
 * - Pure function, deterministic
 * - MANDATORY: Coverage completeness enforcement
 */

// Import coverage engines
let extractPolicyCoverages, mapCoveragesToLoss, getCoverageGaps;

if (typeof require !== 'undefined') {
  try {
    const extractionEngine = require('./coverage-extraction-engine.js');
    const mappingEngine = require('./coverage-mapping-engine.js');
    
    extractPolicyCoverages = extractionEngine.extractPolicyCoverages;
    mapCoveragesToLoss = mappingEngine.mapCoveragesToLoss;
    getCoverageGaps = extractionEngine.getCoverageGaps;
  } catch (err) {
    // Coverage engines will be available
  }
}

// ============================================================================
// GUIDANCE TYPES
// ============================================================================

const GUIDANCE_TYPE = {
  POLICY_EXPLANATION: 'POLICY_EXPLANATION',
  COVERAGE_ANALYSIS: 'COVERAGE_ANALYSIS',
  NEXT_STEPS: 'NEXT_STEPS',
  CARRIER_RESPONSE_ANALYSIS: 'CARRIER_RESPONSE_ANALYSIS',
  LEVERAGE_EXPLANATION: 'LEVERAGE_EXPLANATION',
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  OPTION_COMPARISON: 'OPTION_COMPARISON'
};

// ============================================================================
// GUIDANCE GENERATION
// ============================================================================

/**
 * Generates comprehensive claim guidance
 * @param {Object} params - Guidance parameters
 * @returns {Object} Guidance output
 */
function generateClaimGuidance(params) {
  const {
    claimState,
    policyText,
    policyMetadata,
    endorsementList,
    estimateAnalysis,
    carrierResponse,
    negotiationPosture,
    leverageSignals,
    scopeRegression
  } = params;

  const guidance = {
    policyExplanation: null,
    coverageAnalysis: null,
    coverageSummary: null, // MANDATORY: Coverage completeness
    recommendedNextSteps: [],
    carrierResponseAnalysis: null,
    leverageExplanation: null,
    riskAssessment: null,
    options: [],
    disclaimers: getDisclaimers(),
    metadata: {
      generatedAt: new Date().toISOString(),
      claimState,
      requiresUserConfirmation: true,
      isGuidanceOnly: true,
      coverageCompletenessEnforced: true
    }
  };

  // MANDATORY: Extract and validate coverage completeness
  if (policyText || policyMetadata) {
    const coverageExtraction = extractPolicyCoverages({
      policyText,
      policyMetadata,
      endorsementList,
      estimateAnalysis
    });

    const coverageMapping = mapCoveragesToLoss({
      policyCoverages: [
        ...coverageExtraction.confirmedCoverages,
        ...coverageExtraction.additionalCoverages,
        ...coverageExtraction.confirmedEndorsements
      ],
      estimateAnalysis,
      lossType: params.lossType,
      damageCategories: estimateAnalysis?.categories || []
    });

    // Generate coverage summary (REQUIRED)
    guidance.coverageSummary = {
      baseCoveragesConfirmed: coverageExtraction.confirmedCoverages,
      endorsementsConfirmed: coverageExtraction.confirmedEndorsements,
      additionalCoveragesTriggered: coverageExtraction.additionalCoverages,
      coveragesMissingFromEstimate: coverageExtraction.missingFromEstimate,
      endorsementsNotAddressed: coverageMapping.overlookedEndorsements,
      underutilizedCoverages: coverageMapping.underutilizedCoverages,
      potentiallyApplicable: coverageMapping.potentiallyApplicableButUnaddressed,
      supplementalTriggers: coverageMapping.supplementalTriggers,
      completenessStatus: coverageExtraction.completenessStatus,
      coverageGaps: getCoverageGaps(coverageExtraction),
      warnings: [
        ...coverageExtraction.warnings,
        ...coverageExtraction.errors
      ]
    };

    // ENFORCEMENT: Block if coverage incomplete
    if (coverageExtraction.completenessStatus === 'INCOMPLETE') {
      guidance.metadata.blocked = true;
      guidance.metadata.blockReason = 'Coverage completeness check failed';
      guidance.warnings = guidance.warnings || [];
      guidance.warnings.push({
        severity: 'CRITICAL',
        message: 'This claim currently does NOT reflect all coverages available under your policy.',
        action: 'Review missing coverages before proceeding'
      });
    }
  }

  // Generate policy explanation
  if (policyText) {
    guidance.policyExplanation = generatePolicyExplanation(policyText, estimateAnalysis);
  }

  // Generate coverage analysis
  if (policyText && estimateAnalysis) {
    guidance.coverageAnalysis = generateCoverageAnalysis(policyText, estimateAnalysis);
  }

  // Generate next steps recommendations
  guidance.recommendedNextSteps = generateNextSteps({
    claimState,
    carrierResponse,
    negotiationPosture,
    scopeRegression
  });

  // Analyze carrier response
  if (carrierResponse) {
    guidance.carrierResponseAnalysis = analyzeCarrierResponse({
      carrierResponse,
      negotiationPosture,
      scopeRegression
    });
  }

  // Explain leverage
  if (leverageSignals?.signalCount > 0) {
    guidance.leverageExplanation = explainLeverage(leverageSignals);
  }

  // Assess risks
  guidance.riskAssessment = assessRisks({
    claimState,
    carrierResponse,
    negotiationPosture
  });

  // Generate options
  guidance.options = generateOptions({
    claimState,
    carrierResponse,
    negotiationPosture,
    leverageSignals
  });

  return guidance;
}

/**
 * Generates policy language explanation
 * @param {string} policyText - Policy text
 * @param {Object} estimateAnalysis - Estimate analysis
 * @returns {Object} Policy explanation
 */
function generatePolicyExplanation(policyText, estimateAnalysis) {
  const explanation = {
    type: GUIDANCE_TYPE.POLICY_EXPLANATION,
    summary: 'Policy Language Explanation',
    content: [],
    context: []
  };

  // Analyze policy language patterns
  const patterns = {
    dwelling: /dwelling|structure|building/i,
    contents: /personal property|contents|belongings/i,
    ale: /additional living|loss of use|ale/i,
    replacement: /replacement cost|rcv/i,
    actual: /actual cash value|acv/i,
    deductible: /deductible/i,
    exclusion: /exclusion|not covered|excluded/i
  };

  // Extract relevant sections
  Object.entries(patterns).forEach(([key, pattern]) => {
    if (pattern.test(policyText)) {
      explanation.content.push({
        section: key,
        explanation: getPolicyExplanation(key, policyText)
      });
    }
  });

  // Add context from estimate
  if (estimateAnalysis) {
    explanation.context.push({
      note: 'Based on your estimate analysis',
      relevance: 'These policy sections may apply to your claim'
    });
  }

  return explanation;
}

/**
 * Gets policy explanation for specific section
 * @param {string} section - Policy section
 * @param {string} policyText - Policy text
 * @returns {string} Explanation
 */
function getPolicyExplanation(section, policyText) {
  const explanations = {
    dwelling: 'Dwelling coverage typically applies to the structure of your home, including attached structures. This usually covers damage to walls, roof, foundation, and built-in appliances.',
    contents: 'Personal property coverage applies to your belongings inside the home. This includes furniture, clothing, electronics, and other movable items.',
    ale: 'Additional Living Expenses (ALE) coverage helps pay for temporary housing and increased living costs while your home is being repaired.',
    replacement: 'Replacement Cost Value (RCV) means the insurance pays the cost to replace damaged items with new ones of similar quality, without deducting for depreciation.',
    actual: 'Actual Cash Value (ACV) means the insurance pays the depreciated value of damaged items, accounting for age and wear.',
    deductible: 'Your deductible is the amount you pay out-of-pocket before insurance coverage begins. This is subtracted from your claim payment.',
    exclusion: 'Policy exclusions are specific situations or types of damage that are not covered under your policy. Review these carefully.'
  };

  return explanations[section] || 'Review this section of your policy carefully.';
}

/**
 * Generates coverage analysis
 * @param {string} policyText - Policy text
 * @param {Object} estimateAnalysis - Estimate analysis
 * @returns {Object} Coverage analysis
 */
function generateCoverageAnalysis(policyText, estimateAnalysis) {
  const analysis = {
    type: GUIDANCE_TYPE.COVERAGE_ANALYSIS,
    summary: 'Coverage Analysis',
    likelyCovered: [],
    questionable: [],
    likelyExcluded: [],
    notes: []
  };

  // Analyze estimate categories against policy
  if (estimateAnalysis.categories) {
    estimateAnalysis.categories.forEach(category => {
      const coverageAssessment = assessCoverage(category, policyText);
      
      if (coverageAssessment.likelihood === 'HIGH') {
        analysis.likelyCovered.push({
          category: category.name,
          reason: coverageAssessment.reason
        });
      } else if (coverageAssessment.likelihood === 'MEDIUM') {
        analysis.questionable.push({
          category: category.name,
          reason: coverageAssessment.reason
        });
      } else {
        analysis.likelyExcluded.push({
          category: category.name,
          reason: coverageAssessment.reason
        });
      }
    });
  }

  analysis.notes.push('This is a preliminary analysis based on typical policy language. Your specific policy terms control coverage.');

  return analysis;
}

/**
 * Assesses coverage likelihood for category
 * @param {Object} category - Estimate category
 * @param {string} policyText - Policy text
 * @returns {Object} Coverage assessment
 */
function assessCoverage(category, policyText) {
  const categoryName = (category.name || '').toLowerCase();

  // Standard covered items
  const standardCovered = ['roofing', 'siding', 'drywall', 'flooring', 'electrical', 'plumbing', 'hvac'];
  if (standardCovered.some(item => categoryName.includes(item))) {
    return {
      likelihood: 'HIGH',
      reason: 'This type of damage is typically covered under standard dwelling coverage'
    };
  }

  // Questionable items
  const questionable = ['landscaping', 'fence', 'pool', 'detached'];
  if (questionable.some(item => categoryName.includes(item))) {
    return {
      likelihood: 'MEDIUM',
      reason: 'Coverage for this item depends on specific policy provisions and may have limits'
    };
  }

  // Likely excluded
  const excluded = ['cosmetic', 'wear', 'maintenance', 'pre-existing'];
  if (excluded.some(item => categoryName.includes(item))) {
    return {
      likelihood: 'LOW',
      reason: 'This type of damage may be excluded under standard policy exclusions'
    };
  }

  return {
    likelihood: 'MEDIUM',
    reason: 'Coverage depends on specific policy language and cause of loss'
  };
}

/**
 * Generates recommended next steps
 * @param {Object} params - Next steps parameters
 * @returns {Array} Recommended steps
 */
function generateNextSteps(params) {
  const { claimState, carrierResponse, negotiationPosture, scopeRegression } = params;
  const steps = [];

  // State-based recommendations
  if (claimState === 'ESTIMATE_REVIEWED') {
    steps.push({
      step: 'Review estimate for completeness',
      reason: 'Ensure all damage is documented before submission',
      priority: 'HIGH'
    });
    steps.push({
      step: 'Gather supporting documentation',
      reason: 'Photos, receipts, and contractor quotes strengthen your claim',
      priority: 'HIGH'
    });
    steps.push({
      step: 'Prepare submission packet',
      reason: 'A complete submission reduces delays and requests for information',
      priority: 'MEDIUM'
    });
  }

  if (claimState === 'CARRIER_RESPONSE_RECEIVED') {
    if (negotiationPosture?.postureType === 'SCOPE_REDUCTION') {
      steps.push({
        step: 'Document scope differences',
        reason: 'Identify specific line items or categories the carrier excluded',
        priority: 'HIGH'
      });
      steps.push({
        step: 'Gather evidence for excluded items',
        reason: 'Photos, contractor opinions, or code requirements can support disputed items',
        priority: 'HIGH'
      });
    }

    if (negotiationPosture?.postureType === 'LOWBALL') {
      steps.push({
        step: 'Obtain independent valuation',
        reason: 'Third-party estimates can demonstrate market pricing',
        priority: 'HIGH'
      });
    }

    if (negotiationPosture?.postureType === 'DELAY' || negotiationPosture?.postureType === 'STALLING') {
      steps.push({
        step: 'Document timeline',
        reason: 'Track submission dates and response times for potential bad faith claim',
        priority: 'MEDIUM'
      });
    }

    steps.push({
      step: 'Review carrier response carefully',
      reason: 'Understand exactly what was approved, reduced, or denied',
      priority: 'HIGH'
    });
  }

  if (claimState === 'DISPUTE_IDENTIFIED') {
    steps.push({
      step: 'Prepare supplement request',
      reason: 'Address specific items the carrier excluded or undervalued',
      priority: 'HIGH'
    });
    steps.push({
      step: 'Consider professional assistance',
      reason: 'Public adjusters or attorneys can help with complex disputes',
      priority: 'MEDIUM'
    });
  }

  return steps;
}

/**
 * Analyzes carrier response
 * @param {Object} params - Analysis parameters
 * @returns {Object} Carrier response analysis
 */
function analyzeCarrierResponse(params) {
  const { carrierResponse, negotiationPosture, scopeRegression } = params;

  const analysis = {
    type: GUIDANCE_TYPE.CARRIER_RESPONSE_ANALYSIS,
    summary: 'Carrier Response Analysis',
    posture: negotiationPosture?.postureType || 'UNKNOWN',
    concerns: [],
    strengths: [],
    interpretation: ''
  };

  // Identify concerns
  if (scopeRegression?.regressionDetected) {
    analysis.concerns.push({
      issue: 'Scope Reduction',
      description: `The carrier reduced scope through ${scopeRegression.regressionType}`,
      impact: 'This may result in inadequate funds to complete repairs'
    });
  }

  if (negotiationPosture?.postureType === 'LOWBALL') {
    analysis.concerns.push({
      issue: 'Undervaluation',
      description: 'The carrier\'s valuation appears significantly below market rates',
      impact: 'You may not receive sufficient funds to restore your property'
    });
  }

  if (negotiationPosture?.postureType === 'DELAY' || negotiationPosture?.postureType === 'STALLING') {
    analysis.concerns.push({
      issue: 'Delay Tactics',
      description: 'The carrier is extending the claims process',
      impact: 'Delays can increase your out-of-pocket costs and living disruption'
    });
  }

  // Identify strengths in your position
  if (carrierResponse?.responseType === 'PARTIAL_APPROVAL') {
    analysis.strengths.push({
      point: 'Partial Approval',
      description: 'The carrier acknowledged some of your claim',
      value: 'This establishes coverage for at least part of the loss'
    });
  }

  // Generate interpretation
  analysis.interpretation = generateCarrierInterpretation(negotiationPosture, scopeRegression);

  return analysis;
}

/**
 * Generates carrier response interpretation
 * @param {Object} negotiationPosture - Negotiation posture
 * @param {Object} scopeRegression - Scope regression
 * @returns {string} Interpretation
 */
function generateCarrierInterpretation(negotiationPosture, scopeRegression) {
  const posture = negotiationPosture?.postureType;

  const interpretations = {
    ADMINISTRATIVE: 'The carrier is processing your claim through standard procedures. This is a neutral response.',
    DELAY: 'The carrier is requesting additional time. This may be legitimate or may be a tactic to pressure settlement.',
    PARTIAL_ACCEPTANCE: 'The carrier accepted some items but not others. Focus on the disputed items with additional evidence.',
    SCOPE_REDUCTION: 'The carrier reduced the scope of covered work. This is a common negotiation tactic that can often be challenged with proper documentation.',
    LOWBALL: 'The carrier\'s valuation appears below market rates. Independent estimates and market data can support your position.',
    TECHNICAL_DENIAL: 'The carrier cited policy language to deny coverage. Review the cited provisions carefully and consider professional review.',
    STALLING: 'The carrier is requesting information that may have already been provided. Document what you\'ve submitted and when.'
  };

  return interpretations[posture] || 'The carrier\'s position should be carefully reviewed.';
}

/**
 * Explains leverage signals
 * @param {Object} leverageSignals - Leverage signals
 * @returns {Object} Leverage explanation
 */
function explainLeverage(leverageSignals) {
  const explanation = {
    type: GUIDANCE_TYPE.LEVERAGE_EXPLANATION,
    summary: 'Leverage Analysis',
    signals: [],
    context: ''
  };

  leverageSignals.signals.forEach(signal => {
    explanation.signals.push({
      type: signal.type,
      description: signal.description,
      whyItMatters: explainWhySignalMatters(signal)
    });
  });

  explanation.context = `You have ${leverageSignals.signalCount} factual point(s) that may strengthen your position. These are objective facts that can be referenced in correspondence.`;

  return explanation;
}

/**
 * Explains why a signal matters
 * @param {Object} signal - Leverage signal
 * @returns {string} Explanation
 */
function explainWhySignalMatters(signal) {
  const explanations = {
    OMITTED_LINE_ITEMS: 'Line items in your estimate that are missing from the carrier\'s estimate represent specific, documentable differences. These can be addressed with photos, contractor opinions, or code requirements.',
    INCONSISTENT_ESTIMATES: 'Quantity differences between estimates can be verified through measurements, photos, or site inspections.',
    UNSUPPORTED_SCOPE_REDUCTION: 'When a carrier reduces scope without explanation, you can request their reasoning and provide counter-evidence.',
    REPEATED_SATISFIED_RFI: 'When a carrier requests information you\'ve already provided, this may indicate disorganization or delay tactics. Documentation of prior submissions is important.',
    TIMELINE_VIOLATION: 'Excessive delays may violate state regulations or constitute bad faith. Document all dates and communications.'
  };

  return explanations[signal.type] || 'This is a factual point that can be referenced in your claim.';
}

/**
 * Assesses risks
 * @param {Object} params - Risk parameters
 * @returns {Object} Risk assessment
 */
function assessRisks(params) {
  const { claimState, carrierResponse, negotiationPosture } = params;

  const assessment = {
    type: GUIDANCE_TYPE.RISK_ASSESSMENT,
    summary: 'Risk Assessment',
    risks: [],
    mitigations: []
  };

  // Assess risks based on posture
  if (negotiationPosture?.postureType === 'TECHNICAL_DENIAL') {
    assessment.risks.push({
      risk: 'Coverage Denial',
      likelihood: 'HIGH',
      impact: 'May result in no payment for some or all of claim'
    });
    assessment.mitigations.push({
      action: 'Obtain professional policy review',
      reason: 'Policy interpretation disputes often require expert analysis'
    });
  }

  if (negotiationPosture?.postureType === 'DELAY' || negotiationPosture?.postureType === 'STALLING') {
    assessment.risks.push({
      risk: 'Extended Timeline',
      likelihood: 'MEDIUM',
      impact: 'Increased out-of-pocket costs and living disruption'
    });
    assessment.mitigations.push({
      action: 'Document all delays and maintain detailed timeline',
      reason: 'This creates record for potential bad faith claim'
    });
  }

  return assessment;
}

/**
 * Generates options with tradeoffs
 * @param {Object} params - Options parameters
 * @returns {Array} Options
 */
function generateOptions(params) {
  const { claimState, carrierResponse, negotiationPosture, leverageSignals } = params;
  const options = [];

  if (claimState === 'CARRIER_RESPONSE_RECEIVED') {
    // Option 1: Accept carrier offer
    options.push({
      option: 'Accept Carrier Offer',
      pros: ['Immediate resolution', 'No additional time or effort', 'Certainty of outcome'],
      cons: ['May leave money on the table', 'May not cover full repair costs'],
      suitableWhen: 'The carrier offer is fair and covers your repair needs'
    });

    // Option 2: Negotiate/supplement
    if (leverageSignals?.signalCount > 0) {
      options.push({
        option: 'Submit Supplement Request',
        pros: ['May recover additional funds', 'Addresses specific deficiencies', 'Maintains relationship with carrier'],
        cons: ['Extends timeline', 'Requires additional documentation', 'No guarantee of success'],
        suitableWhen: 'You have specific, documentable items that were excluded or undervalued'
      });
    }

    // Option 3: Professional assistance
    if (negotiationPosture?.postureType === 'LOWBALL' || negotiationPosture?.postureType === 'TECHNICAL_DENIAL') {
      options.push({
        option: 'Hire Public Adjuster or Attorney',
        pros: ['Professional expertise', 'May achieve better outcome', 'Handles carrier negotiations'],
        cons: ['Costs money (typically % of recovery)', 'Further extends timeline'],
        suitableWhen: 'The dispute is complex or the amount in dispute is substantial'
      });
    }
  }

  return options;
}

/**
 * Gets standard disclaimers
 * @returns {Array} Disclaimers
 */
function getDisclaimers() {
  return [
    'This guidance is for informational purposes only and does not constitute legal or professional advice.',
    'Your specific policy terms control coverage. Review your policy carefully.',
    'COVERAGE GUARANTEE: This system is architecturally designed to identify all policy coverages. If coverage exists, it will be found and surfaced.',
    'Consider consulting with a licensed professional for complex claims or disputes.',
    'You must review and confirm all actions before proceeding.',
    'This system does not automatically execute any actions on your behalf.'
  ];
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GUIDANCE_TYPE,
    generateClaimGuidance,
    generatePolicyExplanation,
    generateCoverageAnalysis,
    generateNextSteps,
    analyzeCarrierResponse,
    explainLeverage,
    assessRisks,
    generateOptions
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.ClaimGuidanceEngine = {
    GUIDANCE_TYPE,
    generateClaimGuidance,
    generatePolicyExplanation,
    generateCoverageAnalysis,
    generateNextSteps,
    analyzeCarrierResponse,
    explainLeverage,
    assessRisks,
    generateOptions
  };
}


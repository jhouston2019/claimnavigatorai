/**
 * ClaimNavigator AI - Expert-Level Analysis Engine Configuration
 * 
 * This module enforces expert reasoning, cross-step awareness, and schema-locked outputs.
 * AI operates as a constrained expert analysis engine, not a conversational assistant.
 */

// GLOBAL AI RULES (MANDATORY)
const AI_EXPERT_RULES = {
  NO_CONVERSATIONAL_TONE: true,
  NO_QUESTIONS_TO_USER: true,
  NO_FREEFORM_TEXT: true,
  NO_SPECULATION: true,
  REASON_FROM_VERIFIED_INPUTS_ONLY: true
};

// FORBIDDEN PATTERNS (must be removed from all AI outputs)
const FORBIDDEN_PATTERNS = [
  'You may want to',
  'Consider',
  'It might be',
  'You could ask',
  'Perhaps',
  'Maybe',
  'Possibly',
  'You should think about'
];

// REQUIRED PATTERNS (replace forbidden patterns)
const REQUIRED_PATTERNS = {
  'You may want to': 'The policy requires',
  'Consider': 'The policy requires',
  'It might be': 'The evidence shows',
  'You could ask': 'Request clarification on',
  'Perhaps': 'The policy indicates',
  'Maybe': 'The policy indicates',
  'Possibly': 'The evidence suggests',
  'You should think about': 'The policy requires'
};

// EXPERT REASONING CONSTRAINT (injected into every AI prompt)
const EXPERT_SYSTEM_PROMPT = `You are acting as a licensed insurance claim expert.
You must identify risks, omissions, and leverage points.
Do not provide advice beyond the scope of the documents.
Do not speculate.
Output must be deterministic and schema-locked.
Never use conversational language.
State facts, requirements, and implications only.`;

// REPORT SCHEMAS (validation schemas for each step)
const REPORT_SCHEMAS = {
  1: { // Policy Intelligence Report
    required: ['coverages', 'limits', 'exclusions', 'duties', 'deadlines', 'riskFlags'],
    sections: [
      'Executive Summary',
      'Covered Losses & Property',
      'Coverage Limits & Sublimits',
      'Endorsements & Riders',
      'Exclusions & Restrictions',
      'Loss Settlement Terms',
      'Policyholder Duties',
      'Deadlines & Time Requirements',
      'ALE Rules',
      'Contents Coverage Rules',
      'Critical Risk Flags'
    ]
  },
  2: { // Compliance Status Report
    required: ['mitigationStatus', 'noticeStatus', 'cooperationStatus', 'deadlineMatrix', 'overallStatus'],
    sections: [
      'Mitigation Compliance Status',
      'Notice of Loss Compliance',
      'Cooperation Compliance',
      'Property Protection Compliance',
      'Deadline Compliance Matrix',
      'Overall Compliance Status'
    ]
  },
  3: { // Damage Documentation Report
    required: ['structuralDamage', 'contentsDamage', 'causeOfLoss', 'completenessScore', 'missingEvidence'],
    sections: [
      'Structural Damage Summary',
      'Contents Damage Summary',
      'Cause of Loss Validation',
      'Photo/Video Completeness Score',
      'Missing Evidence Flags'
    ]
  },
  4: { // Estimate Quality Report
    required: ['credentialsCheck', 'scopeCompleteness', 'lineItemDetail', 'codeUpgrades', 'deficiencies'],
    sections: [
      'Estimator Credentials Check',
      'Scope Completeness Analysis',
      'Line-Item Detail Score',
      'Code Upgrade Identification',
      'Estimate Deficiency Flags'
    ]
  },
  5: { // Estimate Comparison Report
    required: ['missingScope', 'pricingDiscrepancies', 'codeOmissions', 'underScoping', 'totalDiscrepancy'],
    sections: [
      'Missing Scope Items',
      'Pricing Discrepancies',
      'Code Upgrade Omissions',
      'Under-Scoping Issues',
      'Total Discrepancy Amount'
    ]
  },
  6: { // ALE Compliance Report
    required: ['eligibility', 'expenseValidation', 'reasonableness', 'durationTracking', 'underpaymentFlags'],
    sections: [
      'Eligibility Confirmation',
      'Expense Category Validation',
      'Reasonableness Analysis',
      'Duration Limit Tracking',
      'ALE Underpayment Flags'
    ]
  },
  7: { // Inventory Completeness Report
    required: ['roomByRoom', 'categoryDistribution', 'missingItems', 'completenessScore'],
    sections: [
      'Room-by-Room Inventory Status',
      'Category Distribution',
      'Missing Item Detection',
      'Inventory Completeness Score'
    ]
  },
  8: { // Contents Valuation Report
    required: ['rcvCalculations', 'acvCalculations', 'depreciation', 'holdback', 'undervaluationFlags'],
    sections: [
      'RCV Calculations',
      'ACV Calculations',
      'Depreciation Analysis',
      'Holdback Recovery Amounts',
      'Undervaluation Flags'
    ]
  },
  9: { // Coverage Alignment Report
    required: ['coverageMapping', 'sublimitImpact', 'uncoveredLoss', 'missedCoverage'],
    sections: [
      'Coverage-to-Loss Mapping',
      'Sublimit Impact Analysis',
      'Uncovered Loss Flags',
      'Missed Coverage Opportunities'
    ]
  },
  10: { // Claim Package Readiness Report
    required: ['includedDocuments', 'missingDocuments', 'narrativeQuality', 'readinessStatus'],
    sections: [
      'Included Documents List',
      'Missing Documents Flags',
      'Narrative Quality Score',
      'Submission Readiness Status'
    ]
  },
  12: { // Carrier Response Analysis Report
    required: ['legitimacyAnalysis', 'deadlineTracking', 'recommendedResponse', 'badFaithFlags'],
    sections: [
      'Request Legitimacy Analysis',
      'Response Deadline Tracking',
      'AI-Drafted Response',
      'Delay or Bad Faith Flags'
    ]
  },
  13: { // Supplement Strategy Report
    required: ['underpaymentId', 'supplementalAmounts', 'leveragePoints', 'escalationOptions'],
    sections: [
      'Underpayment Identification',
      'Supplemental Amounts',
      'Negotiation Leverage Points',
      'Escalation Recommendations'
    ]
  }
};

/**
 * Get cross-step context for AI injection
 * @param {number} currentStep - Current step number
 * @returns {string} - Formatted context from prior steps
 */
function getCrossStepContext(currentStep) {
  if (currentStep <= 1) return '';
  
  let context = '\n\nSYSTEM CONTEXT (READ-ONLY):\n';
  
  for (let step = 1; step < currentStep; step++) {
    const output = getToolOutput(step, getPrimaryToolId(step));
    if (output) {
      const stepData = window.stepData[step];
      context += `\n--- Step ${step}: ${stepData.title} ---\n`;
      
      if (output.sections && Array.isArray(output.sections)) {
        output.sections.forEach(section => {
          context += `${section.title}: ${section.content || section.text || ''}\n`;
        });
      } else if (output.summary) {
        context += `${output.summary}\n`;
      }
    }
  }
  
  context += '\nYou must reference prior findings when relevant.\n';
  return context;
}

/**
 * Validate AI output against schema
 * @param {number} stepNum - Step number
 * @param {object} output - AI output to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateAIOutput(stepNum, output) {
  const schema = REPORT_SCHEMAS[stepNum];
  if (!schema) return { valid: true, errors: [] };
  
  const errors = [];
  
  // Check required fields
  if (schema.required) {
    schema.required.forEach(field => {
      if (!output[field] && !output.sections?.find(s => s.id === field)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }
  
  // Check required sections
  if (schema.sections && output.sections) {
    schema.sections.forEach(sectionTitle => {
      if (!output.sections.find(s => s.title === sectionTitle)) {
        errors.push(`Missing required section: ${sectionTitle}`);
      }
    });
  }
  
  // Check for forbidden patterns
  const outputText = JSON.stringify(output).toLowerCase();
  FORBIDDEN_PATTERNS.forEach(pattern => {
    if (outputText.includes(pattern.toLowerCase())) {
      errors.push(`Forbidden pattern detected: "${pattern}"`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Sanitize AI output by removing forbidden patterns
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeAIOutput(text) {
  let sanitized = text;
  
  Object.keys(REQUIRED_PATTERNS).forEach(forbidden => {
    const replacement = REQUIRED_PATTERNS[forbidden];
    const regex = new RegExp(forbidden, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  });
  
  return sanitized;
}

/**
 * Build expert AI prompt with constraints
 * @param {number} stepNum - Step number
 * @param {object} inputs - User inputs for analysis
 * @returns {string} - Complete AI prompt
 */
function buildExpertPrompt(stepNum, inputs) {
  let prompt = EXPERT_SYSTEM_PROMPT + '\n\n';
  
  // Add cross-step context
  prompt += getCrossStepContext(stepNum);
  
  // Add current step instructions
  const schema = REPORT_SCHEMAS[stepNum];
  if (schema) {
    prompt += `\n\nREQUIRED OUTPUT STRUCTURE:\n`;
    prompt += `You must generate a report with these exact sections:\n`;
    schema.sections.forEach(section => {
      prompt += `- ${section}\n`;
    });
    prompt += `\nEach section must identify risks, omissions, and leverage points.\n`;
  }
  
  // Add inputs
  prompt += `\n\nINPUTS FOR ANALYSIS:\n`;
  prompt += JSON.stringify(inputs, null, 2);
  
  prompt += `\n\nOUTPUT FORMAT:\n`;
  prompt += `Return JSON only with this structure:\n`;
  prompt += `{\n`;
  prompt += `  "sections": [\n`;
  prompt += `    { "title": "Section Name", "content": "Analysis content", "riskFlags": [] }\n`;
  prompt += `  ],\n`;
  prompt += `  "summary": "Executive summary"\n`;
  prompt += `}\n`;
  
  return prompt;
}

/**
 * Process AI output with validation and sanitization
 * @param {number} stepNum - Step number
 * @param {object} rawOutput - Raw AI output
 * @returns {object} - { success: boolean, output: object, errors: string[] }
 */
function processAIOutput(stepNum, rawOutput) {
  // Validate schema
  const validation = validateAIOutput(stepNum, rawOutput);
  
  if (!validation.valid) {
    return {
      success: false,
      output: null,
      errors: validation.errors
    };
  }
  
  // Sanitize content
  const sanitized = JSON.parse(JSON.stringify(rawOutput));
  
  if (sanitized.sections) {
    sanitized.sections = sanitized.sections.map(section => ({
      ...section,
      content: sanitizeAIOutput(section.content || ''),
      title: section.title
    }));
  }
  
  if (sanitized.summary) {
    sanitized.summary = sanitizeAIOutput(sanitized.summary);
  }
  
  // Add metadata
  sanitized.metadata = {
    stepNumber: stepNum,
    generatedAt: new Date().toISOString(),
    version: '1.0',
    expertMode: true
  };
  
  return {
    success: true,
    output: sanitized,
    errors: []
  };
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AI_EXPERT_RULES,
    EXPERT_SYSTEM_PROMPT,
    REPORT_SCHEMAS,
    getCrossStepContext,
    validateAIOutput,
    sanitizeAIOutput,
    buildExpertPrompt,
    processAIOutput
  };
}


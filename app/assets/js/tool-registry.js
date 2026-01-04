/**
 * CLAIM NAVIGATOR TOOL REGISTRY
 * 
 * This registry maps step guide tool IDs to actual tool pages.
 * It bridges the gap between the step-by-step guide and the resource center.
 */

const TOOL_REGISTRY = {
  // ============================================
  // STEP 1: POLICY REVIEW
  // ============================================
  'policy-intelligence-engine': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'policy',
    reportType: 'Policy_Intelligence_Report'
  },
  'policy-uploader': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'policy'
  },
  'policy-report-viewer': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'policy'
  },
  'coverage-qa-chat': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'policy'
  },
  'coverage-clarification-letter': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'coverage-clarification'
  },
  'policy-interpretation-letter': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'policy-interpretation'
  },
  'download-policy-report': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'policy'
  },

  // ============================================
  // STEP 2: COMPLIANCE REVIEW
  // ============================================
  'compliance-review': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'compliance',
    reportType: 'Compliance_Status_Report'
  },
  'compliance-auto-import': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'compliance'
  },
  'compliance-report-viewer': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'compliance'
  },
  'deadline-calculator': {
    url: '/app/deadlines.html',
    engine: 'deadlines',
    mode: 'calculator'
  },
  'mitigation-documentation-tool': {
    url: '/app/evidence-organizer.html',
    engine: 'evidence',
    mode: 'mitigation'
  },
  'proof-of-loss-tracker': {
    url: '/app/statement-of-loss.html',
    engine: 'statement',
    mode: 'proof-of-loss'
  },
  'euo-sworn-statement-guide': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'euo-guide'
  },

  // ============================================
  // STEP 3: DAMAGE DOCUMENTATION
  // ============================================
  'damage-documentation': {
    url: '/app/claim-analysis-tools/damage.html',
    engine: 'claim-analysis',
    mode: 'damage',
    reportType: 'Damage_Documentation_Report'
  },
  'damage-report-engine': {
    url: '/app/claim-analysis-tools/damage.html',
    engine: 'claim-analysis',
    mode: 'damage'
  },
  'damage-report-viewer': {
    url: '/app/claim-analysis-tools/damage.html',
    engine: 'claim-analysis',
    mode: 'damage'
  },
  'photo-upload-organizer': {
    url: '/app/evidence-organizer.html',
    engine: 'evidence',
    mode: 'photos'
  },
  'damage-labeling-tool': {
    url: '/app/evidence-organizer.html',
    engine: 'evidence',
    mode: 'labeling'
  },
  'missing-evidence-identifier': {
    url: '/app/evidence-organizer.html',
    engine: 'evidence',
    mode: 'missing'
  },

  // ============================================
  // STEP 4: ESTIMATE REVIEW
  // ============================================
  'estimate-review': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'quality',
    reportType: 'Estimate_Quality_Report'
  },
  'contractor-scope-checklist': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'scope-checklist'
  },
  'code-upgrade-identifier': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'code-upgrades'
  },
  'missing-trade-detector': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'missing-trades'
  },
  'estimate-revision-request-generator': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'estimate-revision'
  },

  // ============================================
  // STEP 5: ESTIMATE COMPARISON
  // ============================================
  'estimate-comparison': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'comparison',
    reportType: 'Estimate_Comparison_Report'
  },
  'line-item-discrepancy-finder': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'discrepancies'
  },
  'pricing-deviation-analyzer': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'pricing'
  },
  'scope-omission-detector': {
    url: '/app/claim-analysis-tools/estimates.html',
    engine: 'estimate-review',
    mode: 'omissions'
  },
  'negotiation-language-generator': {
    url: '/app/negotiation-tools.html',
    engine: 'negotiation',
    mode: 'language'
  },

  // ============================================
  // STEP 6: ALE TRACKER
  // ============================================
  'ale-tracker': {
    url: '/app/claim-analysis-tools/business.html',
    engine: 'claim-analysis',
    mode: 'ale',
    reportType: 'ALE_Compliance_Report'
  },
  'expense-upload-tool': {
    url: '/app/evidence-organizer.html',
    engine: 'evidence',
    mode: 'expenses'
  },
  'ale-eligibility-checker': {
    url: '/app/claim-analysis-tools/business.html',
    engine: 'claim-analysis',
    mode: 'ale-eligibility'
  },
  'remaining-ale-limit-calculator': {
    url: '/app/claim-analysis-tools/business.html',
    engine: 'claim-analysis',
    mode: 'ale-limits'
  },
  'temporary-housing-documentation-helper': {
    url: '/app/evidence-organizer.html',
    engine: 'evidence',
    mode: 'housing'
  },

  // ============================================
  // STEP 7: CONTENTS INVENTORY
  // ============================================
  'contents-inventory': {
    url: '/app/evidence-organizer.html',
    engine: 'contents',
    mode: 'inventory',
    reportType: 'Inventory_Completeness_Report'
  },
  'room-by-room-prompt-tool': {
    url: '/app/evidence-organizer.html',
    engine: 'contents',
    mode: 'room-prompts'
  },
  'category-coverage-checker': {
    url: '/app/evidence-organizer.html',
    engine: 'contents',
    mode: 'categories'
  },
  'contents-documentation-helper': {
    url: '/app/evidence-organizer.html',
    engine: 'contents',
    mode: 'documentation'
  },

  // ============================================
  // STEP 8: CONTENTS VALUATION
  // ============================================
  'contents-valuation': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'contents',
    mode: 'valuation',
    reportType: 'Contents_Valuation_Report'
  },
  'depreciation-calculator': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'contents',
    mode: 'depreciation'
  },
  'comparable-item-finder': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'contents',
    mode: 'comparables'
  },
  'replacement-cost-justification-tool': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'contents',
    mode: 'rcv-justification'
  },

  // ============================================
  // STEP 9: COVERAGE ALIGNMENT
  // ============================================
  'coverage-alignment': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'alignment',
    reportType: 'Coverage_Alignment_Report'
  },
  'coverage-mapping-visualizer': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'coverage-map'
  },
  'sublimit-impact-analyzer': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'sublimits'
  },
  'endorsement-opportunity-identifier': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'endorsements'
  },
  'coverage-gap-detector': {
    url: '/app/claim-analysis-tools/policy.html',
    engine: 'claim-analysis',
    mode: 'gaps'
  },

  // ============================================
  // STEP 10: CLAIM PACKAGE ASSEMBLY
  // ============================================
  'claim-package-assembly': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'claim-analysis',
    mode: 'assembly',
    reportType: 'Claim_Package_Readiness_Report'
  },
  'submission-checklist-generator': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'submission-checklist'
  },
  'missing-document-identifier': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'missing-docs'
  },
  'pre-submission-risk-review-tool': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'claim-analysis',
    mode: 'risk-review'
  },
  'carrier-submission-cover-letter-generator': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'cover-letter'
  },

  // ============================================
  // STEP 11: SUBMIT CLAIM
  // ============================================
  'submission-method': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'method-guide'
  },
  'claim-submitter': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'submit',
    reportType: 'Submission_Confirmation_Report'
  },
  'submission-report-engine': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'report'
  },
  'method-timestamp-view': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'timestamp'
  },
  'acknowledgment-status-view': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'acknowledgment'
  },
  'followup-schedule-view': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'followup'
  },
  'step11-next-moves': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'next-moves'
  },
  'step11-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step11'
  },
  'submission-confirmation-email': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'submission-email'
  },
  'followup-status-letter': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'followup-letter'
  },
  'download-submission-report': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'submission',
    mode: 'download'
  },

  // ============================================
  // STEP 12: CARRIER RESPONSE
  // ============================================
  'carrier-response': {
    url: '/app/ai-response-agent.html',
    engine: 'correspondence',
    mode: 'carrier',
    reportType: 'Carrier_Response_Analysis_Report'
  },
  'carrier-request-logger': {
    url: '/app/claim-journal.html',
    engine: 'journal',
    mode: 'requests'
  },
  'deadline-response-tracker': {
    url: '/app/deadlines.html',
    engine: 'deadlines',
    mode: 'response-tracker'
  },
  'response-letter-generator': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'response-letter'
  },
  'document-production-checklist': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'production-checklist'
  },

  // ============================================
  // STEP 13: SUPPLEMENT ANALYSIS
  // ============================================
  'supplement-analysis': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'estimate-review',
    mode: 'supplement',
    reportType: 'Supplement_Strategy_Report'
  },
  'supplement-calculation-tool': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'settlement',
    mode: 'supplement-calc'
  },
  'negotiation-strategy-generator': {
    url: '/app/negotiation-tools.html',
    engine: 'negotiation',
    mode: 'strategy'
  },
  'supplement-cover-letter-generator': {
    url: '/app/document-generator-v2/document-generator.html',
    engine: 'document-generator',
    mode: 'supplement-letter'
  },
  'escalation-readiness-checker': {
    url: '/app/claim-analysis-tools/settlement.html',
    engine: 'settlement',
    mode: 'escalation'
  },

  // ============================================
  // ACKNOWLEDGMENT TOOLS (ALL STEPS)
  // ============================================
  'step1-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step1'
  },
  'step2-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step2'
  },
  'step3-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step3'
  },
  'step4-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step4'
  },
  'step5-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step5'
  },
  'step6-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step6'
  },
  'step7-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step7'
  },
  'step8-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step8'
  },
  'step9-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step9'
  },
  'step10-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step10'
  },
  'step12-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step12'
  },
  'step13-acknowledgment': {
    url: '/step-by-step-claim-guide.html',
    engine: 'acknowledgment',
    mode: 'step13'
  }
};

/**
 * Get tool configuration by ID
 * @param {string} toolId - The tool identifier
 * @returns {object|null} Tool configuration or null if not found
 */
function getToolConfig(toolId) {
  return TOOL_REGISTRY[toolId] || null;
}

/**
 * Check if a tool exists in the registry
 * @param {string} toolId - The tool identifier
 * @returns {boolean} True if tool exists
 */
function toolExists(toolId) {
  return toolId in TOOL_REGISTRY;
}

/**
 * Get all tools for a specific engine
 * @param {string} engine - The engine name
 * @returns {array} Array of tool configurations
 */
function getToolsByEngine(engine) {
  return Object.entries(TOOL_REGISTRY)
    .filter(([id, config]) => config.engine === engine)
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get all primary tools (those with reportType)
 * @returns {array} Array of primary tool configurations
 */
function getPrimaryTools() {
  return Object.entries(TOOL_REGISTRY)
    .filter(([id, config]) => config.reportType)
    .map(([id, config]) => ({ id, ...config }));
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOOL_REGISTRY, getToolConfig, toolExists, getToolsByEngine, getPrimaryTools };
}


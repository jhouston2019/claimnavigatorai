/**
 * CLAIM NAVIGATOR TOOL REGISTRY
 * 
 * This registry maps step guide tool IDs back to the step-by-step claim guide.
 * All tools are embedded within the step-by-step guide interface.
 * 
 * Updated: January 2026
 */

const TOOL_REGISTRY = {
  // All tools redirect to step-by-step guide with step parameter
  // The guide handles tool functionality internally
  
  // Step 1 - Policy Review
  'policy-uploader': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 1
  },
  'policy-intelligence-engine': {
    url: '/step-by-step-claim-guide.html?step=1',
    engine: 'guide',
    mode: 'embedded',
    step: 1
  },
  'policy-report-viewer': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 1
  },
  'step1-acknowledgment': {
    url: '/step-by-step-claim-guide.html?step=1',
    engine: 'acknowledgment',
    mode: 'embedded',
    step: 1
  },
  'coverage-qa-chat': {
    url: '/step-by-step-claim-guide.html?step=1',
    engine: 'guide',
    mode: 'embedded',
    step: 1
  },
  'coverage-clarification-letter': {
    url: '/step-by-step-claim-guide.html?step=1',
    engine: 'guide',
    mode: 'embedded',
    step: 1
  },
  'policy-interpretation-letter': {
    url: '/step-by-step-claim-guide.html?step=1',
    engine: 'guide',
    mode: 'embedded',
    step: 1
  },
  'download-policy-report': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 1
  },
  
  // Step 2 - Policyholder Duties
  'compliance-auto-import': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 2
  },
  'compliance-review': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 2
  },
  'compliance-report-viewer': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 2
  },
  'step2-acknowledgment': {
    url: '/step-by-step-claim-guide.html?step=2',
    engine: 'acknowledgment',
    mode: 'embedded',
    step: 2
  },
  'deadline-calculator': {
    url: '/step-by-step-claim-guide.html?step=2',
    engine: 'guide',
    mode: 'embedded',
    step: 2
  },
  'mitigation-documentation-tool': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 2
  },
  'proof-of-loss-tracker': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 2
  },
  'euo-sworn-statement-guide': {
    url: '/step-by-step-claim-guide.html?step=2',
    engine: 'guide',
    mode: 'embedded',
    step: 2
  },
  
  // Step 3 - Damage Documentation
  'damage-documentation': {
    url: '/step-by-step-claim-guide.html?step=3',
    engine: 'guide',
    mode: 'embedded',
    step: 3
  },
  'damage-report-engine': {
    url: '/step-by-step-claim-guide.html?step=3',
    engine: 'guide',
    mode: 'embedded',
    step: 3
  },
  'damage-report-viewer': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 3
  },
  'step3-acknowledgment': {
    url: '/step-by-step-claim-guide.html?step=3',
    engine: 'acknowledgment',
    mode: 'embedded',
    step: 3
  },
  'photo-upload-organizer': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 3
  },
  'damage-labeling-tool': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 3
  },
  'missing-evidence-identifier': {
    url: '/step-by-step-claim-guide.html?step=3',
    engine: 'guide',
    mode: 'embedded',
    step: 3
  },
  
  // Step 4 - Repair Estimate
  'estimate-review': {
    url: '/step-by-step-claim-guide.html?step=4',
    engine: 'guide',
    mode: 'embedded',
    step: 4
  },
  'contractor-scope-checklist': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 4
  },
  'code-upgrade-identifier': {
    url: '/step-by-step-claim-guide.html?step=4',
    engine: 'guide',
    mode: 'embedded',
    step: 4
  },
  'missing-trade-detector': {
    url: '/step-by-step-claim-guide.html?step=4',
    engine: 'guide',
    mode: 'embedded',
    step: 4
  },
  'estimate-revision-request-generator': {
    url: '/step-by-step-claim-guide.html?step=4',
    engine: 'guide',
    mode: 'embedded',
    step: 4
  },
  
  // Step 5 - Estimate Comparison
  'estimate-comparison': {
    url: '/step-by-step-claim-guide.html?step=5',
    engine: 'guide',
    mode: 'embedded',
    step: 5
  },
  'line-item-discrepancy-finder': {
    url: '/step-by-step-claim-guide.html?step=5',
    engine: 'guide',
    mode: 'embedded',
    step: 5
  },
  'pricing-deviation-analyzer': {
    url: '/step-by-step-claim-guide.html?step=5',
    engine: 'guide',
    mode: 'embedded',
    step: 5
  },
  'scope-omission-detector': {
    url: '/step-by-step-claim-guide.html?step=5',
    engine: 'guide',
    mode: 'embedded',
    step: 5
  },
  'negotiation-language-generator': {
    url: '/step-by-step-claim-guide.html?step=5',
    engine: 'guide',
    mode: 'embedded',
    step: 5
  },
  
  // Step 6 - ALE & Housing
  'ale-tracker': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 6
  },
  'expense-upload-tool': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 6
  },
  'ale-eligibility-checker': {
    url: '/step-by-step-claim-guide.html?step=6',
    engine: 'guide',
    mode: 'embedded',
    step: 6
  },
  'remaining-ale-limit-calculator': {
    url: '/step-by-step-claim-guide.html?step=6',
    engine: 'guide',
    mode: 'embedded',
    step: 6
  },
  'temporary-housing-documentation-helper': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 6
  },
  
  // Step 7 - Contents Inventory
  'contents-inventory': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 7
  },
  'room-by-room-prompt-tool': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 7
  },
  'category-coverage-checker': {
    url: '/step-by-step-claim-guide.html?step=7',
    engine: 'guide',
    mode: 'embedded',
    step: 7
  },
  'contents-documentation-helper': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 7
  },
  
  // Step 8 - Contents Valuation
  'contents-valuation': {
    url: '/step-by-step-claim-guide.html?step=8',
    engine: 'guide',
    mode: 'embedded',
    step: 8
  },
  'depreciation-calculator': {
    url: '/step-by-step-claim-guide.html?step=8',
    engine: 'guide',
    mode: 'embedded',
    step: 8
  },
  'comparable-item-finder': {
    url: '/step-by-step-claim-guide.html?step=8',
    engine: 'guide',
    mode: 'embedded',
    step: 8
  },
  'replacement-cost-justification-tool': {
    url: '/step-by-step-claim-guide.html?step=8',
    engine: 'guide',
    mode: 'embedded',
    step: 8
  },
  
  // Step 9 - Coverage Alignment
  'coverage-alignment': {
    url: '/step-by-step-claim-guide.html?step=9',
    engine: 'guide',
    mode: 'embedded',
    step: 9
  },
  'coverage-mapping-visualizer': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 9
  },
  'sublimit-impact-analyzer': {
    url: '/step-by-step-claim-guide.html?step=9',
    engine: 'guide',
    mode: 'embedded',
    step: 9
  },
  'endorsement-opportunity-identifier': {
    url: '/step-by-step-claim-guide.html?step=9',
    engine: 'guide',
    mode: 'embedded',
    step: 9
  },
  'coverage-gap-detector': {
    url: '/step-by-step-claim-guide.html?step=9',
    engine: 'guide',
    mode: 'embedded',
    step: 9
  },
  
  // Step 10 - Claim Package
  'claim-package-assembly': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 10
  },
  'submission-checklist-generator': {
    url: '/step-by-step-claim-guide.html?step=10',
    engine: 'guide',
    mode: 'embedded',
    step: 10
  },
  'missing-document-identifier': {
    url: '/step-by-step-claim-guide.html?step=10',
    engine: 'guide',
    mode: 'embedded',
    step: 10
  },
  'pre-submission-risk-review-tool': {
    url: '/step-by-step-claim-guide.html?step=10',
    engine: 'guide',
    mode: 'embedded',
    step: 10
  },
  'carrier-submission-cover-letter-generator': {
    url: '/step-by-step-claim-guide.html?step=10',
    engine: 'guide',
    mode: 'embedded',
    step: 10
  },
  
  // Step 11 - Submit Claim
  'submission-method': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  'claim-submitter': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  'submission-report-engine': {
    url: '/step-by-step-claim-guide.html?step=11',
    engine: 'guide',
    mode: 'embedded',
    step: 11
  },
  'method-timestamp-view': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  'acknowledgment-status-view': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  'followup-schedule-view': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  'step11-next-moves': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  'step11-acknowledgment': {
    url: '/step-by-step-claim-guide.html?step=11',
    engine: 'acknowledgment',
    mode: 'embedded',
    step: 11
  },
  'submission-confirmation-email': {
    url: '/step-by-step-claim-guide.html?step=11',
    engine: 'guide',
    mode: 'embedded',
    step: 11
  },
  'followup-status-letter': {
    url: '/step-by-step-claim-guide.html?step=11',
    engine: 'guide',
    mode: 'embedded',
    step: 11
  },
  'download-submission-report': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 11
  },
  
  // Step 12 - Carrier Requests
  'carrier-response': {
    url: '/step-by-step-claim-guide.html?step=12',
    engine: 'guide',
    mode: 'embedded',
    step: 12
  },
  'carrier-request-logger': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 12
  },
  'deadline-response-tracker': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 12
  },
  'response-letter-generator': {
    url: '/step-by-step-claim-guide.html?step=12',
    engine: 'guide',
    mode: 'embedded',
    step: 12
  },
  'document-production-checklist': {
    url: '/workflow-tool.html',
    engine: 'workflow',
    mode: 'standalone',
    step: 12
  },
  
  // Step 13 - Underpayments
  'supplement-analysis': {
    url: '/step-by-step-claim-guide.html?step=13',
    engine: 'guide',
    mode: 'embedded',
    step: 13
  },
  'supplement-calculation-tool': {
    url: '/step-by-step-claim-guide.html?step=13',
    engine: 'guide',
    mode: 'embedded',
    step: 13
  },
  'negotiation-strategy-generator': {
    url: '/step-by-step-claim-guide.html?step=13',
    engine: 'guide',
    mode: 'embedded',
    step: 13
  },
  'supplement-cover-letter-generator': {
    url: '/step-by-step-claim-guide.html?step=13',
    engine: 'guide',
    mode: 'embedded',
    step: 13
  },
  'escalation-readiness-checker': {
    url: '/step-by-step-claim-guide.html?step=13',
    engine: 'guide',
    mode: 'embedded',
    step: 13
  }
};

// Helper function to get tool configuration
function getToolConfig(toolId) {
  return TOOL_REGISTRY[toolId] || null;
}

// Helper function to open a tool (redirects to step-by-step guide)
function openTool(toolId, stepNum) {
  const config = getToolConfig(toolId);
  if (!config) {
    console.error(`Tool not found: ${toolId}`);
    return;
  }
  
  // All tools redirect to the step-by-step guide
  const step = stepNum || config.step || 1;
  window.location.href = `/step-by-step-claim-guide.html?step=${step}`;
}

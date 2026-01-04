/**
 * CLAIM NAVIGATOR TOOL REGISTRY
 * 
 * This registry maps step guide tool IDs to actual tool pages.
 * All tools are now in /app/tools/ directory with clean, consistent templates.
 * 
 * Updated: January 2026
 */

const TOOL_REGISTRY = {
  'policy-uploader': {
    url: '/app/tools/policy-uploader.html',
    engine: 'tool',
    mode: 'standard'
  },
  'policy-intelligence-engine': {
    url: '/app/tools/policy-intelligence-engine.html',
    engine: 'tool',
    mode: 'standard'
  },
  'policy-report-viewer': {
    url: '/app/tools/policy-report-viewer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'step1-acknowledgment': {
    url: '/app/tools/step1-acknowledgment.html',
    engine: 'tool',
    mode: 'standard'
  },
  'coverage-qa-chat': {
    url: '/app/tools/coverage-qa-chat.html',
    engine: 'tool',
    mode: 'standard'
  },
  'coverage-clarification-letter': {
    url: '/app/tools/coverage-clarification-letter.html',
    engine: 'tool',
    mode: 'standard'
  },
  'policy-interpretation-letter': {
    url: '/app/tools/policy-interpretation-letter.html',
    engine: 'tool',
    mode: 'standard'
  },
  'download-policy-report': {
    url: '/app/tools/download-policy-report.html',
    engine: 'tool',
    mode: 'standard'
  },
  'compliance-auto-import': {
    url: '/app/tools/compliance-auto-import.html',
    engine: 'tool',
    mode: 'standard'
  },
  'compliance-review': {
    url: '/app/tools/compliance-review.html',
    engine: 'tool',
    mode: 'standard'
  },
  'compliance-report-viewer': {
    url: '/app/tools/compliance-report-viewer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'step2-acknowledgment': {
    url: '/app/tools/step2-acknowledgment.html',
    engine: 'tool',
    mode: 'standard'
  },
  'deadline-calculator': {
    url: '/app/tools/deadline-calculator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'mitigation-documentation-tool': {
    url: '/app/tools/mitigation-documentation-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'proof-of-loss-tracker': {
    url: '/app/tools/proof-of-loss-tracker.html',
    engine: 'tool',
    mode: 'standard'
  },
  'euo-sworn-statement-guide': {
    url: '/app/tools/euo-sworn-statement-guide.html',
    engine: 'tool',
    mode: 'standard'
  },
  'damage-documentation': {
    url: '/app/tools/damage-documentation.html',
    engine: 'tool',
    mode: 'standard'
  },
  'damage-report-engine': {
    url: '/app/tools/damage-report-engine.html',
    engine: 'tool',
    mode: 'standard'
  },
  'damage-report-viewer': {
    url: '/app/tools/damage-report-viewer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'step3-acknowledgment': {
    url: '/app/tools/step3-acknowledgment.html',
    engine: 'tool',
    mode: 'standard'
  },
  'photo-upload-organizer': {
    url: '/app/tools/photo-upload-organizer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'damage-labeling-tool': {
    url: '/app/tools/damage-labeling-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'missing-evidence-identifier': {
    url: '/app/tools/missing-evidence-identifier.html',
    engine: 'tool',
    mode: 'standard'
  },
  'estimate-review': {
    url: '/app/tools/estimate-review.html',
    engine: 'tool',
    mode: 'standard'
  },
  'contractor-scope-checklist': {
    url: '/app/tools/contractor-scope-checklist.html',
    engine: 'tool',
    mode: 'standard'
  },
  'code-upgrade-identifier': {
    url: '/app/tools/code-upgrade-identifier.html',
    engine: 'tool',
    mode: 'standard'
  },
  'missing-trade-detector': {
    url: '/app/tools/missing-trade-detector.html',
    engine: 'tool',
    mode: 'standard'
  },
  'estimate-revision-request-generator': {
    url: '/app/tools/estimate-revision-request-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'estimate-comparison': {
    url: '/app/tools/estimate-comparison.html',
    engine: 'tool',
    mode: 'standard'
  },
  'line-item-discrepancy-finder': {
    url: '/app/tools/line-item-discrepancy-finder.html',
    engine: 'tool',
    mode: 'standard'
  },
  'pricing-deviation-analyzer': {
    url: '/app/tools/pricing-deviation-analyzer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'scope-omission-detector': {
    url: '/app/tools/scope-omission-detector.html',
    engine: 'tool',
    mode: 'standard'
  },
  'negotiation-language-generator': {
    url: '/app/tools/negotiation-language-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'ale-tracker': {
    url: '/app/tools/ale-tracker.html',
    engine: 'tool',
    mode: 'standard'
  },
  'expense-upload-tool': {
    url: '/app/tools/expense-upload-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'ale-eligibility-checker': {
    url: '/app/tools/ale-eligibility-checker.html',
    engine: 'tool',
    mode: 'standard'
  },
  'remaining-ale-limit-calculator': {
    url: '/app/tools/remaining-ale-limit-calculator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'temporary-housing-documentation-helper': {
    url: '/app/tools/temporary-housing-documentation-helper.html',
    engine: 'tool',
    mode: 'standard'
  },
  'contents-inventory': {
    url: '/app/tools/contents-inventory.html',
    engine: 'tool',
    mode: 'standard'
  },
  'room-by-room-prompt-tool': {
    url: '/app/tools/room-by-room-prompt-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'category-coverage-checker': {
    url: '/app/tools/category-coverage-checker.html',
    engine: 'tool',
    mode: 'standard'
  },
  'contents-documentation-helper': {
    url: '/app/tools/contents-documentation-helper.html',
    engine: 'tool',
    mode: 'standard'
  },
  'contents-valuation': {
    url: '/app/tools/contents-valuation.html',
    engine: 'tool',
    mode: 'standard'
  },
  'depreciation-calculator': {
    url: '/app/tools/depreciation-calculator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'comparable-item-finder': {
    url: '/app/tools/comparable-item-finder.html',
    engine: 'tool',
    mode: 'standard'
  },
  'replacement-cost-justification-tool': {
    url: '/app/tools/replacement-cost-justification-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'coverage-alignment': {
    url: '/app/tools/coverage-alignment.html',
    engine: 'tool',
    mode: 'standard'
  },
  'coverage-mapping-visualizer': {
    url: '/app/tools/coverage-mapping-visualizer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'sublimit-impact-analyzer': {
    url: '/app/tools/sublimit-impact-analyzer.html',
    engine: 'tool',
    mode: 'standard'
  },
  'endorsement-opportunity-identifier': {
    url: '/app/tools/endorsement-opportunity-identifier.html',
    engine: 'tool',
    mode: 'standard'
  },
  'coverage-gap-detector': {
    url: '/app/tools/coverage-gap-detector.html',
    engine: 'tool',
    mode: 'standard'
  },
  'claim-package-assembly': {
    url: '/app/tools/claim-package-assembly.html',
    engine: 'tool',
    mode: 'standard'
  },
  'submission-checklist-generator': {
    url: '/app/tools/submission-checklist-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'missing-document-identifier': {
    url: '/app/tools/missing-document-identifier.html',
    engine: 'tool',
    mode: 'standard'
  },
  'pre-submission-risk-review-tool': {
    url: '/app/tools/pre-submission-risk-review-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'carrier-submission-cover-letter-generator': {
    url: '/app/tools/carrier-submission-cover-letter-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'submission-method': {
    url: '/app/tools/submission-method.html',
    engine: 'tool',
    mode: 'standard'
  },
  'claim-submitter': {
    url: '/app/tools/claim-submitter.html',
    engine: 'tool',
    mode: 'standard'
  },
  'submission-report-engine': {
    url: '/app/tools/submission-report-engine.html',
    engine: 'tool',
    mode: 'standard'
  },
  'method-timestamp-view': {
    url: '/app/tools/method-timestamp-view.html',
    engine: 'tool',
    mode: 'standard'
  },
  'acknowledgment-status-view': {
    url: '/app/tools/acknowledgment-status-view.html',
    engine: 'tool',
    mode: 'standard'
  },
  'followup-schedule-view': {
    url: '/app/tools/followup-schedule-view.html',
    engine: 'tool',
    mode: 'standard'
  },
  'step11-next-moves': {
    url: '/app/tools/step11-next-moves.html',
    engine: 'tool',
    mode: 'standard'
  },
  'step11-acknowledgment': {
    url: '/app/tools/step11-acknowledgment.html',
    engine: 'tool',
    mode: 'standard'
  },
  'submission-confirmation-email': {
    url: '/app/tools/submission-confirmation-email.html',
    engine: 'tool',
    mode: 'standard'
  },
  'followup-status-letter': {
    url: '/app/tools/followup-status-letter.html',
    engine: 'tool',
    mode: 'standard'
  },
  'download-submission-report': {
    url: '/app/tools/download-submission-report.html',
    engine: 'tool',
    mode: 'standard'
  },
  'carrier-response': {
    url: '/app/tools/carrier-response.html',
    engine: 'tool',
    mode: 'standard'
  },
  'carrier-request-logger': {
    url: '/app/tools/carrier-request-logger.html',
    engine: 'tool',
    mode: 'standard'
  },
  'deadline-response-tracker': {
    url: '/app/tools/deadline-response-tracker.html',
    engine: 'tool',
    mode: 'standard'
  },
  'response-letter-generator': {
    url: '/app/tools/response-letter-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'document-production-checklist': {
    url: '/app/tools/document-production-checklist.html',
    engine: 'tool',
    mode: 'standard'
  },
  'supplement-analysis': {
    url: '/app/tools/supplement-analysis.html',
    engine: 'tool',
    mode: 'standard'
  },
  'supplement-calculation-tool': {
    url: '/app/tools/supplement-calculation-tool.html',
    engine: 'tool',
    mode: 'standard'
  },
  'negotiation-strategy-generator': {
    url: '/app/tools/negotiation-strategy-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'supplement-cover-letter-generator': {
    url: '/app/tools/supplement-cover-letter-generator.html',
    engine: 'tool',
    mode: 'standard'
  },
  'escalation-readiness-checker': {
    url: '/app/tools/escalation-readiness-checker.html',
    engine: 'tool',
    mode: 'standard'
  },
}

// Helper function to get tool configuration
function getToolConfig(toolId) {
  return TOOL_REGISTRY[toolId] || null;
}

// Helper function to open a tool
function openTool(toolId, stepNum) {
  const config = getToolConfig(toolId);
  if (!config) {
    console.error(`Tool not found: ${toolId}`);
    return;
  }
  
  const url = config.url + (stepNum ? `?step=${stepNum}` : '');
  window.location.href = url;
}

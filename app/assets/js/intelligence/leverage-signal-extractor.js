/**
 * LEVERAGE SIGNAL EXTRACTOR
 * Extracts objective leverage signals from carrier response
 * 
 * CRITICAL CONSTRAINTS:
 * - Factual signals only
 * - Source-backed evidence
 * - No strategy advice
 * - No tactics
 * - Descriptive only
 */

// ============================================================================
// SIGNAL TYPES
// ============================================================================

const SIGNAL_TYPE = {
  OMITTED_LINE_ITEMS: 'OMITTED_LINE_ITEMS',
  INCONSISTENT_ESTIMATES: 'INCONSISTENT_ESTIMATES',
  UNSUPPORTED_SCOPE_REDUCTION: 'UNSUPPORTED_SCOPE_REDUCTION',
  REPEATED_SATISFIED_RFI: 'REPEATED_SATISFIED_RFI',
  TIMELINE_VIOLATION: 'TIMELINE_VIOLATION'
};

// ============================================================================
// SIGNAL EXTRACTION
// ============================================================================

/**
 * Extracts leverage signals from carrier interaction
 * @param {Object} params - Extraction parameters
 * @returns {Object} Extracted signals
 */
function extractLeverageSignals(params) {
  const {
    estimateDelta,
    carrierResponse,
    submissionHistory = [],
    claimTimeline = {}
  } = params;

  const signals = [];

  // Signal 1: Omitted line items
  if (estimateDelta?.removedLineItems?.length > 0) {
    estimateDelta.removedLineItems.forEach(item => {
      signals.push({
        type: SIGNAL_TYPE.OMITTED_LINE_ITEMS,
        description: `Line item not present in carrier estimate: "${item.description}"`,
        source: 'estimate_delta',
        evidence: {
          lineNumber: item.lineNumber,
          description: item.description,
          amount: item.amount
        },
        detectedAt: new Date().toISOString()
      });
    });
  }

  // Signal 2: Inconsistent estimates
  if (estimateDelta?.reducedQuantities?.length > 0) {
    estimateDelta.reducedQuantities.forEach(item => {
      signals.push({
        type: SIGNAL_TYPE.INCONSISTENT_ESTIMATES,
        description: `Quantity differs: "${item.description}" - submitted: ${item.before}, carrier: ${item.after}`,
        source: 'estimate_delta',
        evidence: {
          lineNumber: item.lineNumber,
          description: item.description,
          submittedQuantity: item.before,
          carrierQuantity: item.after
        },
        detectedAt: new Date().toISOString()
      });
    });
  }

  // Signal 3: Unsupported scope reduction
  if (estimateDelta?.categoryOmissions?.length > 0) {
    estimateDelta.categoryOmissions.forEach(omission => {
      signals.push({
        type: SIGNAL_TYPE.UNSUPPORTED_SCOPE_REDUCTION,
        description: `Category not present in carrier estimate: ${omission.category}`,
        source: 'estimate_delta',
        evidence: {
          category: omission.category,
          affectedItemCount: omission.affectedItemCount,
          issue: omission.issue
        },
        detectedAt: new Date().toISOString()
      });
    });
  }

  // Signal 4: Repeated satisfied RFI
  if (carrierResponse?.responseType === 'REQUEST_FOR_INFORMATION') {
    const previousRFIs = submissionHistory.filter(
      submission => submission.type === 'information_response'
    );

    if (previousRFIs.length > 0) {
      // Check if current RFI requests already-provided information
      const carrierText = carrierResponse.carrierText || '';
      
      previousRFIs.forEach(prevRFI => {
        if (prevRFI.itemsProvided && Array.isArray(prevRFI.itemsProvided)) {
          prevRFI.itemsProvided.forEach(item => {
            // Simple keyword matching to detect repeated requests
            const itemKeywords = item.toLowerCase().split(/\s+/);
            const matchesFound = itemKeywords.filter(keyword => 
              keyword.length > 3 && carrierText.toLowerCase().includes(keyword)
            );

            if (matchesFound.length >= 2) {
              signals.push({
                type: SIGNAL_TYPE.REPEATED_SATISFIED_RFI,
                description: `Information previously provided: ${item}`,
                source: 'submission_history',
                evidence: {
                  previousSubmissionDate: prevRFI.date,
                  itemProvided: item,
                  currentRequestDate: new Date().toISOString()
                },
                detectedAt: new Date().toISOString()
              });
            }
          });
        }
      });
    }
  }

  // Signal 5: Timeline violations
  if (claimTimeline.submissionDate && claimTimeline.responseDate) {
    const submissionDate = new Date(claimTimeline.submissionDate);
    const responseDate = new Date(claimTimeline.responseDate);
    const daysDiff = Math.floor((responseDate - submissionDate) / (1000 * 60 * 60 * 24));

    // Check if response exceeded typical timeframes
    if (claimTimeline.expectedResponseDays && daysDiff > claimTimeline.expectedResponseDays) {
      signals.push({
        type: SIGNAL_TYPE.TIMELINE_VIOLATION,
        description: `Response received ${daysDiff} days after submission (expected: ${claimTimeline.expectedResponseDays} days)`,
        source: 'claim_timeline',
        evidence: {
          submissionDate: claimTimeline.submissionDate,
          responseDate: claimTimeline.responseDate,
          actualDays: daysDiff,
          expectedDays: claimTimeline.expectedResponseDays
        },
        detectedAt: new Date().toISOString()
      });
    }
  }

  return {
    signals,
    signalCount: signals.length,
    signalTypes: [...new Set(signals.map(s => s.type))],
    metadata: {
      extractedAt: new Date().toISOString(),
      sourcesAnalyzed: getSourcesAnalyzed(params)
    }
  };
}

/**
 * Gets list of sources analyzed
 * @param {Object} params - Extraction parameters
 * @returns {Array} Sources analyzed
 */
function getSourcesAnalyzed(params) {
  const sources = [];

  if (params.estimateDelta) sources.push('estimate_delta');
  if (params.carrierResponse) sources.push('carrier_response');
  if (params.submissionHistory?.length > 0) sources.push('submission_history');
  if (params.claimTimeline) sources.push('claim_timeline');

  return sources;
}

/**
 * Filters signals by type
 * @param {Object} extraction - Signal extraction result
 * @param {string} signalType - Signal type to filter
 * @returns {Array} Filtered signals
 */
function filterSignalsByType(extraction, signalType) {
  return extraction.signals.filter(signal => signal.type === signalType);
}

/**
 * Gets signal summary
 * @param {Object} extraction - Signal extraction result
 * @returns {string} Summary
 */
function getSignalSummary(extraction) {
  if (extraction.signalCount === 0) {
    return 'No leverage signals detected';
  }

  const parts = [];
  
  extraction.signalTypes.forEach(type => {
    const count = extraction.signals.filter(s => s.type === type).length;
    const typeLabel = type.toLowerCase().replace(/_/g, ' ');
    parts.push(`${count} ${typeLabel} signal(s)`);
  });

  return parts.join(', ');
}

/**
 * Validates signal
 * @param {Object} signal - Signal to validate
 * @returns {Object} Validation result
 */
function validateSignal(signal) {
  const issues = [];

  if (!signal.type) {
    issues.push('Missing signal type');
  }

  if (!signal.description) {
    issues.push('Missing description');
  }

  if (!signal.source) {
    issues.push('Missing source');
  }

  if (!signal.evidence) {
    issues.push('Missing evidence');
  }

  // Check for prohibited language
  const prohibitedWords = ['should', 'must', 'recommend', 'advise', 'negotiate', 'demand'];
  const description = (signal.description || '').toLowerCase();
  
  prohibitedWords.forEach(word => {
    if (description.includes(word)) {
      issues.push(`Prohibited word detected: ${word}`);
    }
  });

  const valid = issues.length === 0;

  return {
    valid,
    issues
  };
}

/**
 * Validates extraction result
 * @param {Object} extraction - Extraction to validate
 * @returns {Object} Validation result
 */
function validateExtraction(extraction) {
  const issues = [];

  if (!Array.isArray(extraction.signals)) {
    issues.push('Signals must be an array');
  }

  if (typeof extraction.signalCount !== 'number') {
    issues.push('Signal count must be a number');
  }

  if (extraction.signals.length !== extraction.signalCount) {
    issues.push('Signal count mismatch');
  }

  // Validate each signal
  extraction.signals.forEach((signal, index) => {
    const signalValidation = validateSignal(signal);
    if (!signalValidation.valid) {
      issues.push(`Signal ${index}: ${signalValidation.issues.join(', ')}`);
    }
  });

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
    SIGNAL_TYPE,
    extractLeverageSignals,
    filterSignalsByType,
    getSignalSummary,
    validateSignal,
    validateExtraction
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.LeverageSignalExtractor = {
    SIGNAL_TYPE,
    extractLeverageSignals,
    filterSignalsByType,
    getSignalSummary,
    validateSignal,
    validateExtraction
  };
}


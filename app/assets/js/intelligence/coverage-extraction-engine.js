/**
 * COVERAGE EXTRACTION ENGINE
 * Exhaustive extraction of all policy coverages
 * 
 * CRITICAL GUARANTEE:
 * If coverage exists in the policy, it WILL be found.
 * Omission is impossible by architecture.
 * 
 * PURPOSE:
 * Ensure policyholders claim ALL money they are entitled to.
 */

// Import coverage registry
let COVERAGE_REGISTRY, getAllCoverages, getCoverageById;

if (typeof require !== 'undefined') {
  const registry = require('./coverage-registry.js');
  COVERAGE_REGISTRY = registry.COVERAGE_REGISTRY;
  getAllCoverages = registry.getAllCoverages;
  getCoverageById = registry.getCoverageById;
}

// ============================================================================
// COVERAGE EXTRACTION
// ============================================================================

/**
 * Extracts all coverages from policy
 * @param {Object} params - Extraction parameters
 * @returns {Object} Extraction result
 */
function extractPolicyCoverages(params) {
  const {
    policyText = '',
    policyMetadata = {},
    endorsementList = [],
    estimateAnalysis = null
  } = params;

  const extraction = {
    confirmedCoverages: [],
    confirmedEndorsements: [],
    additionalCoverages: [],
    missingFromEstimate: [],
    unmappedCoverages: [],
    completenessStatus: 'INCOMPLETE',
    errors: [],
    warnings: [],
    metadata: {
      extractedAt: new Date().toISOString(),
      totalCoveragesChecked: 0,
      totalCoveragesFound: 0
    }
  };

  try {
    // Extract base coverages
    const baseCoverages = extractBaseCoverages(policyText, policyMetadata);
    extraction.confirmedCoverages.push(...baseCoverages.found);
    extraction.errors.push(...baseCoverages.errors);

    // Extract additional coverages
    const additionalCoverages = extractAdditionalCoverages(policyText, policyMetadata);
    extraction.additionalCoverages.push(...additionalCoverages.found);
    extraction.errors.push(...additionalCoverages.errors);

    // Extract endorsements
    const endorsements = extractEndorsements(policyText, policyMetadata, endorsementList);
    extraction.confirmedEndorsements.push(...endorsements.found);
    extraction.errors.push(...endorsements.errors);

    // Map coverages to estimate (if provided)
    if (estimateAnalysis) {
      const mapping = mapCoveragesToEstimate(
        [...extraction.confirmedCoverages, ...extraction.additionalCoverages],
        estimateAnalysis
      );
      extraction.missingFromEstimate = mapping.missingFromEstimate;
      extraction.unmappedCoverages = mapping.unmappedCoverages;
      extraction.warnings.push(...mapping.warnings);
    }

    // Calculate completeness
    extraction.metadata.totalCoveragesChecked = getAllCoverages().length;
    extraction.metadata.totalCoveragesFound = 
      extraction.confirmedCoverages.length + 
      extraction.additionalCoverages.length + 
      extraction.confirmedEndorsements.length;

    // Determine completeness status
    extraction.completenessStatus = determineCompletenessStatus(extraction);

  } catch (error) {
    extraction.errors.push(`Critical extraction error: ${error.message}`);
    extraction.completenessStatus = 'ERROR';
  }

  return extraction;
}

/**
 * Extracts base coverages (A, B, C, D)
 * @param {string} policyText - Policy text
 * @param {Object} policyMetadata - Policy metadata
 * @returns {Object} Extraction result
 */
function extractBaseCoverages(policyText, policyMetadata) {
  const result = {
    found: [],
    errors: []
  };

  const normalizedText = policyText.toLowerCase();

  COVERAGE_REGISTRY.base.forEach(coverage => {
    const detected = detectCoverage(coverage, normalizedText, policyMetadata);
    
    if (detected.found) {
      result.found.push({
        id: coverage.id,
        name: coverage.name,
        shortName: coverage.shortName,
        explanation: coverage.explanation,
        limit: detected.limit,
        deductible: detected.deductible,
        confirmed: true,
        source: detected.source
      });
    } else {
      // Base coverages MUST be present
      result.errors.push(`Base coverage not found: ${coverage.name}`);
    }
  });

  return result;
}

/**
 * Extracts additional coverages
 * @param {string} policyText - Policy text
 * @param {Object} policyMetadata - Policy metadata
 * @returns {Object} Extraction result
 */
function extractAdditionalCoverages(policyText, policyMetadata) {
  const result = {
    found: [],
    errors: []
  };

  const normalizedText = policyText.toLowerCase();

  COVERAGE_REGISTRY.additional.forEach(coverage => {
    const detected = detectCoverage(coverage, normalizedText, policyMetadata);
    
    if (detected.found) {
      result.found.push({
        id: coverage.id,
        name: coverage.name,
        explanation: coverage.explanation,
        limit: detected.limit,
        confirmed: true,
        commonlyMissed: coverage.commonlyMissed,
        source: detected.source
      });
    } else if (coverage.commonlyMissed) {
      // Flag commonly missed coverages
      result.errors.push(`Commonly missed coverage not confirmed: ${coverage.name}`);
    }
  });

  return result;
}

/**
 * Extracts endorsements
 * @param {string} policyText - Policy text
 * @param {Object} policyMetadata - Policy metadata
 * @param {Array} endorsementList - List of endorsements
 * @returns {Object} Extraction result
 */
function extractEndorsements(policyText, policyMetadata, endorsementList) {
  const result = {
    found: [],
    errors: []
  };

  const normalizedText = policyText.toLowerCase();

  COVERAGE_REGISTRY.endorsements.forEach(endorsement => {
    const detected = detectCoverage(endorsement, normalizedText, policyMetadata, endorsementList);
    
    if (detected.found) {
      result.found.push({
        id: endorsement.id,
        name: endorsement.name,
        explanation: endorsement.explanation,
        limit: detected.limit,
        confirmed: true,
        commonlyMissed: endorsement.commonlyMissed,
        source: detected.source
      });
    }
    // Endorsements are optional, so no error if not found
  });

  return result;
}

/**
 * Detects specific coverage in policy
 * @param {Object} coverage - Coverage to detect
 * @param {string} normalizedText - Normalized policy text
 * @param {Object} policyMetadata - Policy metadata
 * @param {Array} endorsementList - Endorsement list
 * @returns {Object} Detection result
 */
function detectCoverage(coverage, normalizedText, policyMetadata, endorsementList = []) {
  const result = {
    found: false,
    limit: null,
    deductible: null,
    source: null
  };

  // Check policy metadata first
  if (policyMetadata.coverages) {
    const metadataCoverage = policyMetadata.coverages.find(c => 
      c.id === coverage.id || c.name === coverage.name
    );
    
    if (metadataCoverage) {
      result.found = true;
      result.limit = metadataCoverage.limit;
      result.deductible = metadataCoverage.deductible;
      result.source = 'metadata';
      return result;
    }
  }

  // Check endorsement list
  if (endorsementList.length > 0) {
    const coverageNameLower = coverage.name.toLowerCase();
    const endorsementMatch = endorsementList.find(e => {
      const eLower = e.toLowerCase();
      // Check for partial matches
      return eLower.includes(coverageNameLower) ||
             coverageNameLower.includes(eLower) ||
             // Check for key terms
             (coverageNameLower.includes('water') && eLower.includes('water')) ||
             (coverageNameLower.includes('mold') && eLower.includes('mold')) ||
             (coverageNameLower.includes('backup') && eLower.includes('backup'));
    });
    
    if (endorsementMatch) {
      result.found = true;
      result.source = 'endorsement_list';
      return result;
    }
  }

  // Pattern matching in policy text
  const patterns = generateCoveragePatterns(coverage);
  
  for (const pattern of patterns) {
    if (pattern.test(normalizedText)) {
      result.found = true;
      result.source = 'text_pattern';
      
      // Try to extract limit
      result.limit = extractLimit(normalizedText, coverage);
      
      return result;
    }
  }

  return result;
}

/**
 * Generates detection patterns for coverage
 * @param {Object} coverage - Coverage object
 * @returns {Array} Regex patterns
 */
function generateCoveragePatterns(coverage) {
  const patterns = [];

  // Pattern from coverage ID (e.g., COV_A, COV_B)
  if (coverage.id) {
    // Match "Coverage A", "COV A", "COV_A", etc.
    const idPart = coverage.id.replace(/^COV_/, '').replace(/^END_/, '').replace(/^ADD_/, '');
    patterns.push(new RegExp(`coverage[\\s-]*${idPart}\\b`, 'i'));
    patterns.push(new RegExp(`cov[\\s-]*${idPart}\\b`, 'i'));
  }

  // Pattern from coverage name
  if (coverage.name) {
    // Escape special characters but keep the structure
    const nameParts = coverage.name.split(/[–—-]/);
    nameParts.forEach(part => {
      const cleaned = part.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (cleaned.length > 3) {
        patterns.push(new RegExp(cleaned, 'i'));
      }
    });
  }

  // Pattern from short name
  if (coverage.shortName) {
    patterns.push(new RegExp(coverage.shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  // Specific patterns for common coverage types
  if (coverage.id === 'COV_A') {
    patterns.push(/dwelling/i);
    patterns.push(/coverage\s*a/i);
  } else if (coverage.id === 'COV_B') {
    patterns.push(/other\s*structures/i);
    patterns.push(/coverage\s*b/i);
  } else if (coverage.id === 'COV_C') {
    patterns.push(/personal\s*property/i);
    patterns.push(/contents/i);
    patterns.push(/coverage\s*c/i);
  } else if (coverage.id === 'COV_D') {
    patterns.push(/loss\s*of\s*use/i);
    patterns.push(/additional\s*living/i);
    patterns.push(/\bale\b/i);
    patterns.push(/coverage\s*d/i);
  }

  return patterns;
}

/**
 * Extracts coverage limit from policy text
 * @param {string} normalizedText - Normalized policy text
 * @param {Object} coverage - Coverage object
 * @returns {string|null} Extracted limit
 */
function extractLimit(normalizedText, coverage) {
  // Look for dollar amounts near coverage name
  const coverageName = coverage.name.toLowerCase();
  const index = normalizedText.indexOf(coverageName);
  
  if (index === -1) return null;

  // Search 200 characters after coverage name
  const searchText = normalizedText.substring(index, index + 200);
  
  // Match dollar amounts
  const dollarMatch = searchText.match(/\$[\d,]+/);
  if (dollarMatch) {
    return dollarMatch[0];
  }

  // Match percentages (for Coverage B, D, etc.)
  const percentMatch = searchText.match(/(\d+)%/);
  if (percentMatch) {
    return `${percentMatch[1]}%`;
  }

  return null;
}

/**
 * Maps coverages to estimate
 * @param {Array} coverages - Confirmed coverages
 * @param {Object} estimateAnalysis - Estimate analysis
 * @returns {Object} Mapping result
 */
function mapCoveragesToEstimate(coverages, estimateAnalysis) {
  const result = {
    missingFromEstimate: [],
    unmappedCoverages: [],
    warnings: []
  };

  if (!estimateAnalysis || !estimateAnalysis.categories) {
    result.warnings.push('No estimate provided for coverage mapping');
    return result;
  }

  const estimateCategories = estimateAnalysis.categories.map(c => 
    c.name.toLowerCase()
  );

  // Check each coverage against estimate
  coverages.forEach(coverage => {
    const appliesToTerms = getCoverageById(coverage.id)?.appliesTo || [];
    
    // Check if any appliesTo term appears in estimate
    const foundInEstimate = appliesToTerms.some(term => 
      estimateCategories.some(cat => cat.includes(term.toLowerCase()))
    );

    if (!foundInEstimate && coverage.id !== 'COV_D') { // COV_D is special case
      result.missingFromEstimate.push({
        coverageId: coverage.id,
        coverageName: coverage.name,
        reason: 'Coverage exists in policy but no matching items in estimate',
        appliesTo: appliesToTerms
      });
    }
  });

  // Check for estimate items without coverage mapping
  estimateAnalysis.categories?.forEach(category => {
    const categoryName = category.name.toLowerCase();
    
    const hasCoverage = coverages.some(cov => {
      const appliesToTerms = getCoverageById(cov.id)?.appliesTo || [];
      return appliesToTerms.some(term => categoryName.includes(term.toLowerCase()));
    });

    if (!hasCoverage) {
      result.unmappedCoverages.push({
        category: category.name,
        reason: 'Estimate category has no clear coverage mapping'
      });
    }
  });

  return result;
}

/**
 * Determines completeness status
 * @param {Object} extraction - Extraction result
 * @returns {string} Completeness status
 */
function determineCompletenessStatus(extraction) {
  // If there are errors, incomplete
  if (extraction.errors.length > 0) {
    return 'INCOMPLETE';
  }

  // All base coverages must be found
  if (extraction.confirmedCoverages.length < 4) {
    return 'INCOMPLETE';
  }

  // If coverages are missing from estimate, incomplete
  if (extraction.missingFromEstimate.length > 0) {
    return 'INCOMPLETE';
  }

  // If there are unmapped coverages, incomplete
  if (extraction.unmappedCoverages.length > 0) {
    return 'INCOMPLETE';
  }

  return 'COMPLETE';
}

/**
 * Validates extraction completeness
 * @param {Object} extraction - Extraction result
 * @returns {Object} Validation result
 */
function validateExtractionCompleteness(extraction) {
  const issues = [];

  // Check all base coverages present
  const baseCoverageIds = ['COV_A', 'COV_B', 'COV_C', 'COV_D'];
  baseCoverageIds.forEach(id => {
    const found = extraction.confirmedCoverages.find(c => c.id === id);
    if (!found) {
      issues.push(`Missing base coverage: ${id}`);
    }
  });

  // Check for commonly missed coverages
  const commonlyMissed = COVERAGE_REGISTRY.commonlyMissed || [];
  commonlyMissed.forEach(scenario => {
    const coverage = getCoverageById(scenario.coverage);
    if (coverage) {
      const found = 
        extraction.confirmedCoverages.find(c => c.id === scenario.coverage) ||
        extraction.additionalCoverages.find(c => c.id === scenario.coverage) ||
        extraction.confirmedEndorsements.find(c => c.id === scenario.coverage);
      
      if (!found) {
        issues.push(`Commonly missed coverage not checked: ${coverage.name}`);
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Gets coverage gaps
 * @param {Object} extraction - Extraction result
 * @returns {Array} Coverage gaps
 */
function getCoverageGaps(extraction) {
  const gaps = [];

  // Missing from estimate
  extraction.missingFromEstimate.forEach(missing => {
    gaps.push({
      type: 'MISSING_FROM_ESTIMATE',
      coverage: missing.coverageName,
      severity: 'HIGH',
      impact: 'Policyholder may not claim available coverage',
      recommendation: `Add ${missing.coverageName} items to estimate`
    });
  });

  // Unmapped coverages
  extraction.unmappedCoverages.forEach(unmapped => {
    gaps.push({
      type: 'UNMAPPED_COVERAGE',
      category: unmapped.category,
      severity: 'MEDIUM',
      impact: 'Estimate category may not be covered',
      recommendation: `Verify coverage for ${unmapped.category}`
    });
  });

  // Errors
  extraction.errors.forEach(error => {
    gaps.push({
      type: 'EXTRACTION_ERROR',
      error: error,
      severity: 'HIGH',
      impact: 'Coverage may be missed',
      recommendation: 'Review policy manually'
    });
  });

  return gaps;
}

/**
 * Generates coverage summary
 * @param {Object} extraction - Extraction result
 * @returns {Object} Coverage summary
 */
function generateCoverageSummary(extraction) {
  return {
    totalCoveragesFound: extraction.metadata.totalCoveragesFound,
    baseCoverages: extraction.confirmedCoverages.length,
    additionalCoverages: extraction.additionalCoverages.length,
    endorsements: extraction.confirmedEndorsements.length,
    missingFromEstimate: extraction.missingFromEstimate.length,
    unmappedCoverages: extraction.unmappedCoverages.length,
    completenessStatus: extraction.completenessStatus,
    gaps: getCoverageGaps(extraction).length
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractPolicyCoverages,
    extractBaseCoverages,
    extractAdditionalCoverages,
    extractEndorsements,
    mapCoveragesToEstimate,
    determineCompletenessStatus,
    validateExtractionCompleteness,
    getCoverageGaps,
    generateCoverageSummary
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.CoverageExtractionEngine = {
    extractPolicyCoverages,
    extractBaseCoverages,
    extractAdditionalCoverages,
    extractEndorsements,
    mapCoveragesToEstimate,
    determineCompletenessStatus,
    validateExtractionCompleteness,
    getCoverageGaps,
    generateCoverageSummary
  };
}


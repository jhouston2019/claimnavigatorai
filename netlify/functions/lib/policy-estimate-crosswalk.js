/**
 * Policy-to-Estimate Crosswalk Engine
 * Cross-references policy coverage with estimate line items
 * Detects coverage conflicts and calculates exposure adjustments
 * 
 * NO AI - Pure deterministic logic
 */

/**
 * Cross-reference policy coverage with estimate reconciliation
 * @param {object} params - Input parameters
 * @returns {object} Coverage crosswalk analysis
 */
function analyzePolicyCrosswalk(params) {
  const {
    parsedPolicy = {},
    reconciliation = {},
    exposure = {},
    lineItems = []
  } = params;
  
  const coverageConflicts = [];
  let coverageExposureAdjustments = 0;
  
  // =====================================================
  // CHECK 1: REPLACEMENT COST VS ACV
  // =====================================================
  const rcvCheck = checkReplacementCostCompliance(parsedPolicy, lineItems);
  if (rcvCheck.triggered) {
    coverageConflicts.push(rcvCheck);
    coverageExposureAdjustments += rcvCheck.exposureAdjustment;
  }
  
  // =====================================================
  // CHECK 2: LIKE KIND AND QUALITY
  // =====================================================
  const likeKindCheck = checkLikeKindAndQuality(parsedPolicy, lineItems);
  if (likeKindCheck.triggered) {
    coverageConflicts.push(likeKindCheck);
    coverageExposureAdjustments += likeKindCheck.exposureAdjustment;
  }
  
  // =====================================================
  // CHECK 3: ORDINANCE & LAW ENDORSEMENT
  // =====================================================
  const ordinanceCheck = checkOrdinanceAndLaw(parsedPolicy, reconciliation);
  if (ordinanceCheck.triggered) {
    coverageConflicts.push(ordinanceCheck);
    coverageExposureAdjustments += ordinanceCheck.exposureAdjustment;
  }
  
  // =====================================================
  // CHECK 4: MATCHING CLAUSE
  // =====================================================
  const matchingCheck = checkMatchingClause(parsedPolicy, lineItems);
  if (matchingCheck.triggered) {
    coverageConflicts.push(matchingCheck);
    coverageExposureAdjustments += matchingCheck.exposureAdjustment;
  }
  
  // =====================================================
  // CHECK 5: DEDUCTIBLE VALIDATION
  // =====================================================
  const deductibleCheck = checkDeductibleApplication(parsedPolicy, reconciliation);
  if (deductibleCheck.triggered) {
    coverageConflicts.push(deductibleCheck);
    coverageExposureAdjustments += deductibleCheck.exposureAdjustment;
  }
  
  // =====================================================
  // CHECK 6: SUBLIMIT CONFLICTS
  // =====================================================
  const sublimitCheck = checkSublimitConflicts(parsedPolicy, reconciliation);
  if (sublimitCheck.triggered) {
    coverageConflicts.push(sublimitCheck);
    coverageExposureAdjustments += sublimitCheck.exposureAdjustment;
  }
  
  return {
    coverageConflicts: coverageConflicts,
    coverageExposureAdjustments: parseFloat(coverageExposureAdjustments.toFixed(2)),
    conflictCount: coverageConflicts.length,
    metadata: {
      engine_version: '1.0',
      calculation_method: 'deterministic',
      checks_performed: 6
    }
  };
}

/**
 * Check replacement cost compliance
 */
function checkReplacementCostCompliance(parsedPolicy, lineItems) {
  const settlementType = parsedPolicy.settlement_type || '';
  const isRCV = settlementType.toUpperCase().includes('RCV') || 
                settlementType.toLowerCase().includes('replacement');
  
  if (!isRCV) {
    return { triggered: false };
  }
  
  // Check for material downgrades in carrier estimate
  const downgrades = [];
  
  for (const item of lineItems) {
    const desc = item.description?.toLowerCase() || '';
    
    // Detect quality indicators
    if (desc.includes('standard') || desc.includes('economy') || desc.includes('basic')) {
      downgrades.push({
        item: item.description,
        issue: 'Potential material downgrade detected'
      });
    }
  }
  
  if (downgrades.length > 0) {
    return {
      triggered: true,
      issue: 'Replacement Cost Policy - Material Downgrade Detected',
      category: 'coverage_conflict',
      priority: 'high',
      explanation: `Policy requires Replacement Cost settlement, but carrier estimate may include downgraded materials. RCV policies require "like kind and quality" replacement.`,
      exposureAdjustment: 0, // Cannot quantify without specific upgrade costs
      downgrades: downgrades
    };
  }
  
  return { triggered: false };
}

/**
 * Check like kind and quality enforcement
 */
function checkLikeKindAndQuality(parsedPolicy, lineItems) {
  // Look for quality mismatches between contractor and carrier
  // This requires matched line items with quality indicators
  
  const qualityConflicts = [];
  
  for (const item of lineItems) {
    const desc = item.description?.toLowerCase() || '';
    
    // Detect functional replacement (downgrade)
    if (desc.includes('functional') || desc.includes('equivalent')) {
      qualityConflicts.push({
        item: item.description,
        issue: 'Functional replacement does not meet like kind and quality standard'
      });
    }
  }
  
  if (qualityConflicts.length > 0) {
    return {
      triggered: true,
      issue: 'Like Kind and Quality Conflict',
      category: 'coverage_conflict',
      priority: 'medium',
      explanation: 'Carrier estimate may include functional replacement instead of like kind and quality. Policy requires matching quality level.',
      exposureAdjustment: 0,
      conflicts: qualityConflicts
    };
  }
  
  return { triggered: false };
}

/**
 * Check ordinance and law endorsement
 */
function checkOrdinanceAndLaw(parsedPolicy, reconciliation) {
  const hasOrdinanceCoverage = parsedPolicy.ordinance_law_percent > 0 ||
                               parsedPolicy.endorsements?.ordinance_law === true;
  
  if (!hasOrdinanceCoverage) {
    return { triggered: false };
  }
  
  // If ordinance coverage exists, code upgrades are covered
  const ordinancePercent = parsedPolicy.ordinance_law_percent || 25;
  const buildingLimit = parsedPolicy.dwelling_limit || parsedPolicy.building_limit || 0;
  const maxOrdinanceCoverage = buildingLimit * (ordinancePercent / 100);
  
  return {
    triggered: true,
    issue: 'Ordinance & Law Coverage Available',
    category: 'coverage_enhancement',
    priority: 'high',
    explanation: `Policy includes ${ordinancePercent}% Ordinance & Law coverage (up to ${formatCurrency(maxOrdinanceCoverage)}). Code upgrade costs are covered under this endorsement.`,
    exposureAdjustment: 0, // Enables code upgrades, doesn't add direct exposure
    coverage_available: maxOrdinanceCoverage,
    ordinance_percent: ordinancePercent
  };
}

/**
 * Check matching clause
 */
function checkMatchingClause(parsedPolicy, lineItems) {
  const hasMatchingEndorsement = parsedPolicy.endorsements?.matching === true;
  
  if (!hasMatchingEndorsement) {
    return { triggered: false };
  }
  
  // Check for partial replacements that may trigger matching
  const partialReplacements = [];
  
  for (const item of lineItems) {
    const desc = item.description?.toLowerCase() || '';
    
    // Detect partial replacements
    if ((desc.includes('siding') || desc.includes('roof')) && 
        (desc.includes('section') || desc.includes('side') || desc.includes('partial'))) {
      partialReplacements.push({
        item: item.description,
        category: item.category
      });
    }
  }
  
  if (partialReplacements.length > 0) {
    return {
      triggered: true,
      issue: 'Matching Endorsement Applies',
      category: 'coverage_enhancement',
      priority: 'high',
      explanation: 'Policy includes matching endorsement. Partial replacements require matching undamaged portions to avoid aesthetic mismatch. This expands scope significantly.',
      exposureAdjustment: 0, // Cannot quantify without full scope
      partial_replacements: partialReplacements
    };
  }
  
  return { triggered: false };
}

/**
 * Check deductible application
 */
function checkDeductibleApplication(parsedPolicy, reconciliation) {
  const deductible = parsedPolicy.deductible || 0;
  const totals = reconciliation.totals || {};
  const carrierTotal = totals.carrier_total || 0;
  
  if (deductible === 0) {
    return { triggered: false };
  }
  
  // Check if carrier total is suspiciously close to deductible
  if (Math.abs(carrierTotal - deductible) < 500) {
    return {
      triggered: true,
      issue: 'Deductible Application Conflict',
      category: 'coverage_conflict',
      priority: 'medium',
      explanation: `Carrier estimate total ($${carrierTotal.toFixed(2)}) is very close to policy deductible ($${deductible.toFixed(2)}). Verify carrier is not artificially limiting estimate to deductible amount.`,
      exposureAdjustment: 0,
      carrier_total: carrierTotal,
      deductible: deductible,
      difference: Math.abs(carrierTotal - deductible)
    };
  }
  
  return { triggered: false };
}

/**
 * Check sublimit conflicts
 */
function checkSublimitConflicts(parsedPolicy, reconciliation) {
  const sublimits = parsedPolicy.sublimits || {};
  const categoryBreakdown = reconciliation.categoryBreakdown || {};
  
  const conflicts = [];
  
  // Check water damage sublimit
  if (sublimits.water && categoryBreakdown.Water) {
    const waterTotal = categoryBreakdown.Water.contractor_total || 0;
    if (waterTotal > sublimits.water) {
      conflicts.push({
        category: 'Water',
        sublimit: sublimits.water,
        estimated_cost: waterTotal,
        excess: waterTotal - sublimits.water
      });
    }
  }
  
  // Check mold sublimit
  if (sublimits.mold && categoryBreakdown.Mold) {
    const moldTotal = categoryBreakdown.Mold.contractor_total || 0;
    if (moldTotal > sublimits.mold) {
      conflicts.push({
        category: 'Mold',
        sublimit: sublimits.mold,
        estimated_cost: moldTotal,
        excess: moldTotal - sublimits.mold
      });
    }
  }
  
  if (conflicts.length > 0) {
    const totalExcess = conflicts.reduce((sum, c) => sum + c.excess, 0);
    
    return {
      triggered: true,
      issue: 'Sublimit Conflicts Detected',
      category: 'coverage_limitation',
      priority: 'critical',
      explanation: `Estimated costs exceed policy sublimits in ${conflicts.length} category(ies). Recovery may be capped.`,
      exposureAdjustment: -totalExcess, // Negative adjustment (reduces recovery)
      conflicts: conflicts
    };
  }
  
  return { triggered: false };
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

module.exports = {
  analyzePolicyCrosswalk,
  checkReplacementCostCompliance,
  checkLikeKindAndQuality,
  checkOrdinanceAndLaw,
  checkMatchingClause,
  checkDeductibleApplication,
  checkSublimitConflicts
};

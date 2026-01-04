/**
 * COVERAGE-TO-LOSS MAPPING ENGINE
 * Maps damage categories to policy coverages
 * 
 * CRITICAL GUARANTEE:
 * If coverage could apply but is absent, it WILL be flagged.
 * 
 * PURPOSE:
 * Identify underutilized coverages and overlooked endorsements.
 */

// Import dependencies
let COVERAGE_REGISTRY, getAllCoverages, getCoverageById, getCoveragesForDamageType;

if (typeof require !== 'undefined') {
  const registry = require('./coverage-registry.js');
  COVERAGE_REGISTRY = registry.COVERAGE_REGISTRY;
  getAllCoverages = registry.getAllCoverages;
  getCoverageById = registry.getCoverageById;
  getCoveragesForDamageType = registry.getCoveragesForDamageType;
}

// ============================================================================
// COVERAGE MAPPING
// ============================================================================

/**
 * Maps coverages to loss/damage
 * @param {Object} params - Mapping parameters
 * @returns {Object} Mapping result
 */
function mapCoveragesToLoss(params) {
  const {
    policyCoverages = [],
    estimateAnalysis = null,
    lossType = null,
    damageCategories = []
  } = params;

  const mapping = {
    categoryMappings: [],
    underutilizedCoverages: [],
    overlookedEndorsements: [],
    potentiallyApplicableButUnaddressed: [],
    supplementalTriggers: [],
    completenessStatus: 'INCOMPLETE',
    metadata: {
      mappedAt: new Date().toISOString(),
      totalCategories: 0,
      totalMapped: 0
    }
  };

  try {
    // Map each estimate category to coverages
    if (estimateAnalysis?.categories) {
      mapping.categoryMappings = mapEstimateCategories(
        estimateAnalysis.categories,
        policyCoverages
      );
      mapping.metadata.totalCategories = estimateAnalysis.categories.length;
      mapping.metadata.totalMapped = mapping.categoryMappings.filter(m => m.mapped).length;
    }

    // Identify underutilized coverages
    mapping.underutilizedCoverages = identifyUnderutilizedCoverages(
      policyCoverages,
      mapping.categoryMappings
    );

    // Identify overlooked endorsements
    mapping.overlookedEndorsements = identifyOverlookedEndorsements(
      policyCoverages,
      estimateAnalysis,
      lossType
    );

    // Identify potentially applicable but unaddressed coverages
    mapping.potentiallyApplicableButUnaddressed = identifyPotentialCoverages(
      policyCoverages,
      estimateAnalysis,
      damageCategories,
      lossType
    );

    // Identify supplemental triggers
    mapping.supplementalTriggers = identifySupplementalTriggers(
      estimateAnalysis,
      policyCoverages
    );

    // Determine completeness
    mapping.completenessStatus = determineMappingCompleteness(mapping);

  } catch (error) {
    mapping.errors = [`Mapping error: ${error.message}`];
    mapping.completenessStatus = 'ERROR';
  }

  return mapping;
}

/**
 * Maps estimate categories to coverages
 * @param {Array} categories - Estimate categories
 * @param {Array} policyCoverages - Policy coverages
 * @returns {Array} Category mappings
 */
function mapEstimateCategories(categories, policyCoverages) {
  const mappings = [];

  categories.forEach(category => {
    const mapping = {
      category: category.name,
      itemCount: category.itemCount,
      amount: category.total,
      coverages: [],
      mapped: false,
      warnings: []
    };

    // Find applicable coverages
    const categoryLower = category.name.toLowerCase();
    
    policyCoverages.forEach(coverage => {
      const coverageObj = getCoverageById(coverage.id);
      if (!coverageObj) return;

      const applies = coverageObj.appliesTo.some(term => 
        categoryLower.includes(term.toLowerCase())
      );

      if (applies) {
        mapping.coverages.push({
          id: coverage.id,
          name: coverage.name,
          confidence: 'HIGH'
        });
        mapping.mapped = true;
      }
    });

    // Check for unmapped categories
    if (!mapping.mapped) {
      mapping.warnings.push('No clear coverage mapping found');
      
      // Suggest potential coverages
      const potential = suggestCoveragesForCategory(category.name);
      if (potential.length > 0) {
        mapping.warnings.push(`Consider: ${potential.map(p => p.name).join(', ')}`);
      }
    }

    mappings.push(mapping);
  });

  return mappings;
}

/**
 * Suggests coverages for category
 * @param {string} categoryName - Category name
 * @returns {Array} Suggested coverages
 */
function suggestCoveragesForCategory(categoryName) {
  const suggestions = [];
  const categoryLower = categoryName.toLowerCase();

  // Check all coverages for partial matches
  getAllCoverages().forEach(coverage => {
    const score = calculateMatchScore(categoryLower, coverage);
    if (score > 0.3) {
      suggestions.push({
        ...coverage,
        matchScore: score
      });
    }
  });

  return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

/**
 * Calculates match score between category and coverage
 * @param {string} categoryLower - Category name (lowercase)
 * @param {Object} coverage - Coverage object
 * @returns {number} Match score (0-1)
 */
function calculateMatchScore(categoryLower, coverage) {
  let score = 0;
  let checks = 0;

  // Check appliesTo terms
  if (coverage.appliesTo) {
    coverage.appliesTo.forEach(term => {
      checks++;
      if (categoryLower.includes(term.toLowerCase())) {
        score += 1;
      }
    });
  }

  // Check triggers
  if (coverage.triggers) {
    coverage.triggers.forEach(trigger => {
      checks++;
      if (categoryLower.includes(trigger.toLowerCase())) {
        score += 0.5;
      }
    });
  }

  return checks > 0 ? score / checks : 0;
}

/**
 * Identifies underutilized coverages
 * @param {Array} policyCoverages - Policy coverages
 * @param {Array} categoryMappings - Category mappings
 * @returns {Array} Underutilized coverages
 */
function identifyUnderutilizedCoverages(policyCoverages, categoryMappings) {
  const underutilized = [];

  policyCoverages.forEach(coverage => {
    // Check if coverage is used in any mapping
    const used = categoryMappings.some(mapping => 
      mapping.coverages.some(c => c.id === coverage.id)
    );

    if (!used) {
      const coverageObj = getCoverageById(coverage.id);
      underutilized.push({
        id: coverage.id,
        name: coverage.name,
        explanation: coverageObj?.explanation,
        reason: 'Coverage exists in policy but no matching items in estimate',
        appliesTo: coverageObj?.appliesTo,
        commonlyMissed: coverageObj?.commonlyMissed
      });
    }
  });

  return underutilized;
}

/**
 * Identifies overlooked endorsements
 * @param {Array} policyCoverages - Policy coverages
 * @param {Object} estimateAnalysis - Estimate analysis
 * @param {string} lossType - Type of loss
 * @returns {Array} Overlooked endorsements
 */
function identifyOverlookedEndorsements(policyCoverages, estimateAnalysis, lossType) {
  const overlooked = [];

  // Get confirmed endorsements
  const confirmedEndorsements = policyCoverages.filter(c => 
    c.id && c.id.startsWith('END_')
  );

  confirmedEndorsements.forEach(endorsement => {
    const endorsementObj = getCoverageById(endorsement.id);
    if (!endorsementObj) return;

    // Check if endorsement could apply based on estimate
    const couldApply = checkEndorsementApplicability(
      endorsementObj,
      estimateAnalysis,
      lossType
    );

    if (couldApply.applicable && !couldApply.addressed) {
      overlooked.push({
        id: endorsement.id,
        name: endorsement.name,
        explanation: endorsementObj.explanation,
        reason: couldApply.reason,
        triggers: endorsementObj.triggers,
        recommendation: couldApply.recommendation
      });
    }
  });

  return overlooked;
}

/**
 * Checks endorsement applicability
 * @param {Object} endorsement - Endorsement object
 * @param {Object} estimateAnalysis - Estimate analysis
 * @param {string} lossType - Type of loss
 * @returns {Object} Applicability result
 */
function checkEndorsementApplicability(endorsement, estimateAnalysis, lossType) {
  const result = {
    applicable: false,
    addressed: false,
    reason: '',
    recommendation: ''
  };

  if (!estimateAnalysis) return result;

  const categories = estimateAnalysis.categories || [];
  const categoryNames = categories.map(c => c.name.toLowerCase()).join(' ');

  // Check specific endorsements
  switch (endorsement.id) {
    case 'END_ORDINANCE_ENHANCED':
      if (categoryNames.includes('code') || categoryNames.includes('upgrade')) {
        result.applicable = true;
        result.addressed = true;
      } else {
        result.applicable = true;
        result.addressed = false;
        result.reason = 'Code upgrades may be required but not in estimate';
        result.recommendation = 'Verify if building code upgrades are required';
      }
      break;

    case 'END_WATER_BACKUP':
      if (lossType && lossType.toLowerCase().includes('water')) {
        if (categoryNames.includes('backup') || categoryNames.includes('sewer')) {
          result.applicable = true;
          result.addressed = true;
        } else {
          result.applicable = true;
          result.addressed = false;
          result.reason = 'Water damage present but backup coverage not addressed';
          result.recommendation = 'Verify if water backup endorsement applies';
        }
      }
      break;

    case 'END_MOLD':
      if (categoryNames.includes('mold') || categoryNames.includes('remediation')) {
        result.applicable = true;
        result.addressed = true;
      } else if (lossType && lossType.toLowerCase().includes('water')) {
        result.applicable = true;
        result.addressed = false;
        result.reason = 'Water damage may trigger mold - enhanced coverage available';
        result.recommendation = 'Consider mold assessment and enhanced coverage';
      }
      break;

    case 'END_ROOF_SURFACING':
      if (categoryNames.includes('roof')) {
        result.applicable = true;
        result.addressed = true; // Assume addressed if roof in estimate
      }
      break;

    case 'END_EQUIPMENT':
      if (categoryNames.includes('hvac') || categoryNames.includes('equipment')) {
        result.applicable = true;
        result.addressed = true;
      }
      break;

    default:
      // Check triggers
      if (endorsement.triggers) {
        const triggered = endorsement.triggers.some(trigger => 
          categoryNames.includes(trigger.toLowerCase())
        );
        if (triggered) {
          result.applicable = true;
          result.addressed = true;
        }
      }
  }

  return result;
}

/**
 * Identifies potentially applicable but unaddressed coverages
 * @param {Array} policyCoverages - Policy coverages
 * @param {Object} estimateAnalysis - Estimate analysis
 * @param {Array} damageCategories - Damage categories
 * @param {string} lossType - Type of loss
 * @returns {Array} Potentially applicable coverages
 */
function identifyPotentialCoverages(policyCoverages, estimateAnalysis, damageCategories, lossType) {
  const potential = [];

  // Get all possible coverages
  const allCoverages = getAllCoverages();

  allCoverages.forEach(coverage => {
    // Skip if already in policy coverages
    const alreadyConfirmed = policyCoverages.some(pc => pc.id === coverage.id);
    if (alreadyConfirmed) return;

    // Check if coverage could apply
    const couldApply = checkCoverageApplicability(
      coverage,
      estimateAnalysis,
      damageCategories,
      lossType
    );

    if (couldApply.applicable) {
      potential.push({
        id: coverage.id,
        name: coverage.name,
        explanation: coverage.explanation,
        reason: couldApply.reason,
        confidence: couldApply.confidence,
        recommendation: couldApply.recommendation
      });
    }
  });

  return potential;
}

/**
 * Checks coverage applicability
 * @param {Object} coverage - Coverage object
 * @param {Object} estimateAnalysis - Estimate analysis
 * @param {Array} damageCategories - Damage categories
 * @param {string} lossType - Type of loss
 * @returns {Object} Applicability result
 */
function checkCoverageApplicability(coverage, estimateAnalysis, damageCategories, lossType) {
  const result = {
    applicable: false,
    confidence: 'LOW',
    reason: '',
    recommendation: ''
  };

  if (!estimateAnalysis) return result;

  const categories = estimateAnalysis.categories || [];
  const categoryNames = categories.map(c => c.name.toLowerCase()).join(' ');

  // Check appliesTo terms
  if (coverage.appliesTo) {
    const matches = coverage.appliesTo.filter(term => 
      categoryNames.includes(term.toLowerCase())
    );

    if (matches.length > 0) {
      result.applicable = true;
      result.confidence = matches.length > 1 ? 'HIGH' : 'MEDIUM';
      result.reason = `Damage categories match coverage scope: ${matches.join(', ')}`;
      result.recommendation = `Verify ${coverage.name} applies to this loss`;
    }
  }

  // Check triggers
  if (coverage.triggers) {
    const triggered = coverage.triggers.filter(trigger => 
      categoryNames.includes(trigger.toLowerCase()) ||
      (lossType && lossType.toLowerCase().includes(trigger.toLowerCase()))
    );

    if (triggered.length > 0) {
      result.applicable = true;
      result.confidence = 'MEDIUM';
      result.reason = `Loss characteristics trigger coverage: ${triggered.join(', ')}`;
      result.recommendation = `Review policy for ${coverage.name}`;
    }
  }

  return result;
}

/**
 * Identifies supplemental triggers
 * @param {Object} estimateAnalysis - Estimate analysis
 * @param {Array} policyCoverages - Policy coverages
 * @returns {Array} Supplemental triggers
 */
function identifySupplementalTriggers(estimateAnalysis, policyCoverages) {
  const triggers = [];

  if (!estimateAnalysis) return triggers;

  // Check for debris removal
  if (estimateAnalysis.categories?.some(c => 
    c.name.toLowerCase().includes('debris') || 
    c.name.toLowerCase().includes('removal')
  )) {
    triggers.push({
      trigger: 'Debris Removal',
      coverage: 'ADD_DEBRIS',
      reason: 'Debris removal costs are separately covered',
      action: 'Ensure debris removal is itemized separately'
    });
  }

  // Check for code upgrades
  if (estimateAnalysis.categories?.some(c => 
    c.name.toLowerCase().includes('code') || 
    c.name.toLowerCase().includes('upgrade')
  )) {
    triggers.push({
      trigger: 'Code Upgrades',
      coverage: 'ADD_ORDINANCE',
      reason: 'Building code upgrades may trigger Ordinance or Law coverage',
      action: 'Document all code-mandated upgrades separately'
    });
  }

  // Check for professional fees
  if (estimateAnalysis.categories?.some(c => 
    c.name.toLowerCase().includes('engineer') || 
    c.name.toLowerCase().includes('architect')
  )) {
    triggers.push({
      trigger: 'Professional Fees',
      coverage: 'ADD_PROFESSIONAL',
      reason: 'Professional fees are separately covered',
      action: 'Itemize all professional service costs'
    });
  }

  return triggers;
}

/**
 * Determines mapping completeness
 * @param {Object} mapping - Mapping result
 * @returns {string} Completeness status
 */
function determineMappingCompleteness(mapping) {
  // If there are underutilized coverages, incomplete
  if (mapping.underutilizedCoverages.length > 0) {
    return 'INCOMPLETE';
  }

  // If there are overlooked endorsements, incomplete
  if (mapping.overlookedEndorsements.length > 0) {
    return 'INCOMPLETE';
  }

  // If there are potentially applicable coverages, incomplete
  if (mapping.potentiallyApplicableButUnaddressed.length > 0) {
    return 'INCOMPLETE';
  }

  // If any category is unmapped, incomplete
  if (mapping.categoryMappings.some(m => !m.mapped)) {
    return 'INCOMPLETE';
  }

  return 'COMPLETE';
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mapCoveragesToLoss,
    mapEstimateCategories,
    identifyUnderutilizedCoverages,
    identifyOverlookedEndorsements,
    identifyPotentialCoverages,
    identifySupplementalTriggers,
    determineMappingCompleteness
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.CoverageMappingEngine = {
    mapCoveragesToLoss,
    mapEstimateCategories,
    identifyUnderutilizedCoverages,
    identifyOverlookedEndorsements,
    identifyPotentialCoverages,
    identifySupplementalTriggers,
    determineMappingCompleteness
  };
}


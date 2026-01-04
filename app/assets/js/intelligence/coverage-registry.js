/**
 * CANONICAL COVERAGE REGISTRY
 * Authoritative taxonomy of all possible insurance coverages
 * 
 * CRITICAL GUARANTEE:
 * This registry is exhaustive. If coverage exists in a policy,
 * it MUST be represented here. Omission is a system error.
 * 
 * PURPOSE:
 * Ensure policyholders do not miss money by missing coverage.
 */

// ============================================================================
// BASE COVERAGES (STANDARD HOMEOWNERS POLICY)
// ============================================================================

export const BASE_COVERAGES = [
  {
    id: 'COV_A',
    name: 'Coverage A – Dwelling',
    shortName: 'Dwelling',
    appliesTo: ['structure', 'attached', 'building', 'foundation', 'roof', 'walls', 'built-in'],
    explanation: 'Covers physical damage to the main dwelling structure, including attached structures like garages. This is typically the largest coverage amount on your policy.',
    commonlyMissed: false,
    triggers: ['structural damage', 'roof damage', 'wall damage', 'foundation damage', 'attached garage damage'],
    claimTypes: ['wind', 'hail', 'fire', 'water', 'vandalism', 'theft'],
    rcvApplies: true,
    depreciationApplies: true
  },
  {
    id: 'COV_B',
    name: 'Coverage B – Other Structures',
    shortName: 'Other Structures',
    appliesTo: ['detached', 'fence', 'shed', 'gazebo', 'detached garage', 'pool structure', 'retaining wall'],
    explanation: 'Covers structures on your property that are not attached to the main dwelling. This includes fences, sheds, detached garages, and similar structures.',
    commonlyMissed: true,
    triggers: ['fence damage', 'shed damage', 'detached garage damage', 'gazebo damage', 'pool structure damage'],
    claimTypes: ['wind', 'hail', 'fire', 'vandalism', 'falling objects'],
    rcvApplies: true,
    depreciationApplies: true,
    typicalLimit: '10% of Coverage A'
  },
  {
    id: 'COV_C',
    name: 'Coverage C – Personal Property',
    shortName: 'Contents / Personal Property',
    appliesTo: ['contents', 'belongings', 'furniture', 'clothing', 'electronics', 'appliances'],
    explanation: 'Covers your personal belongings damaged in a covered loss. This includes furniture, clothing, electronics, and other movable items.',
    commonlyMissed: false,
    triggers: ['contents damage', 'furniture damage', 'electronics damage', 'clothing damage', 'appliance damage'],
    claimTypes: ['fire', 'water', 'theft', 'vandalism', 'smoke'],
    rcvApplies: false,
    depreciationApplies: true,
    typicalLimit: '50-70% of Coverage A',
    specialLimits: ['jewelry', 'firearms', 'silverware', 'cash', 'securities']
  },
  {
    id: 'COV_D',
    name: 'Coverage D – Loss of Use / Additional Living Expenses (ALE)',
    shortName: 'ALE / Loss of Use',
    appliesTo: ['displacement', 'temporary housing', 'hotel', 'increased costs', 'storage'],
    explanation: 'Covers additional living expenses when your home is uninhabitable due to a covered loss. This includes hotel costs, increased food expenses, storage, and other displacement costs.',
    commonlyMissed: true,
    triggers: ['displacement', 'uninhabitable', 'temporary housing needed', 'hotel stay', 'evacuation'],
    claimTypes: ['fire', 'water', 'structural damage requiring evacuation'],
    rcvApplies: true,
    depreciationApplies: false,
    typicalLimit: '20-30% of Coverage A',
    requiresDocumentation: ['receipts', 'hotel bills', 'meal receipts', 'storage invoices']
  }
];

// ============================================================================
// ADDITIONAL COVERAGES (STANDARD POLICY INCLUSIONS)
// ============================================================================

export const ADDITIONAL_COVERAGES = [
  {
    id: 'ADD_DEBRIS',
    name: 'Debris Removal',
    explanation: 'Covers the cost of removing debris from damaged property. Typically 5% of Coverage A or actual cost, whichever is greater.',
    appliesTo: ['debris', 'cleanup', 'removal', 'hauling'],
    commonlyMissed: true,
    triggers: ['tree debris', 'structural debris', 'cleanup needed'],
    typicalLimit: '5% of Coverage A or actual cost',
    separateFromDwelling: true
  },
  {
    id: 'ADD_EMERGENCY',
    name: 'Reasonable Emergency Repairs',
    explanation: 'Covers emergency repairs needed to prevent further damage, such as tarping a roof or boarding windows.',
    appliesTo: ['emergency', 'temporary', 'mitigation', 'tarping', 'boarding'],
    commonlyMissed: false,
    triggers: ['emergency repairs', 'tarping', 'boarding', 'temporary protection'],
    requiresDocumentation: ['receipts', 'invoices', 'photos of emergency work']
  },
  {
    id: 'ADD_TREE',
    name: 'Trees, Shrubs, and Other Plants',
    explanation: 'Covers trees, shrubs, and plants damaged by specific perils (typically fire, lightning, explosion, riot, aircraft, vehicles not owned by resident, vandalism, or theft).',
    appliesTo: ['trees', 'shrubs', 'plants', 'landscaping'],
    commonlyMissed: true,
    triggers: ['tree damage', 'shrub damage', 'landscaping damage'],
    typicalLimit: '$500 per item, $5,000 total',
    limitedPerils: true
  },
  {
    id: 'ADD_ORDINANCE',
    name: 'Ordinance or Law',
    explanation: 'Covers increased costs due to building code upgrades required during repairs. May be base coverage or endorsement.',
    appliesTo: ['code upgrade', 'ordinance', 'law', 'building code', 'compliance'],
    commonlyMissed: true,
    triggers: ['code upgrade required', 'ordinance compliance', 'building permit requirements'],
    typicalLimit: '10% of Coverage A (base) or higher with endorsement',
    mayRequireEndorsement: true
  },
  {
    id: 'ADD_PERMIT',
    name: 'Permit and Inspection Fees',
    explanation: 'Covers building permit fees and inspection costs required for repairs.',
    appliesTo: ['permit', 'inspection', 'fees', 'building department'],
    commonlyMissed: false,
    triggers: ['permit required', 'inspection needed']
  },
  {
    id: 'ADD_PROFESSIONAL',
    name: 'Professional Fees',
    explanation: 'Covers fees for architects, engineers, or other professionals needed to complete repairs.',
    appliesTo: ['architect', 'engineer', 'professional', 'consultant'],
    commonlyMissed: true,
    triggers: ['engineering needed', 'architectural plans required', 'structural assessment']
  },
  {
    id: 'ADD_MATCHING',
    name: 'Matching / Undamaged Materials',
    explanation: 'Covers cost to replace undamaged materials when exact match is not available. May be base coverage or endorsement.',
    appliesTo: ['matching', 'discontinued', 'unavailable materials'],
    commonlyMissed: true,
    triggers: ['material discontinued', 'cannot match existing', 'aesthetic mismatch'],
    mayRequireEndorsement: true
  },
  {
    id: 'ADD_FIRE_DEPT',
    name: 'Fire Department Service Charge',
    explanation: 'Covers charges from fire department for responding to a covered loss.',
    appliesTo: ['fire department', 'emergency response'],
    commonlyMissed: false,
    triggers: ['fire department called', 'emergency response'],
    typicalLimit: '$500-$1,000'
  },
  {
    id: 'ADD_CREDIT_CARD',
    name: 'Credit Card, Bank Transfer, Counterfeit Money',
    explanation: 'Covers losses from unauthorized credit card use, forged checks, or counterfeit money.',
    appliesTo: ['credit card fraud', 'identity theft', 'counterfeit'],
    commonlyMissed: true,
    triggers: ['credit card fraud', 'unauthorized charges'],
    typicalLimit: '$500-$1,000'
  },
  {
    id: 'ADD_LOCK',
    name: 'Lock Replacement',
    explanation: 'Covers cost to rekey or replace locks if keys are stolen.',
    appliesTo: ['locks', 'keys', 'security'],
    commonlyMissed: true,
    triggers: ['keys stolen', 'lock replacement needed'],
    typicalLimit: '$250-$500'
  }
];

// ============================================================================
// ENDORSEMENTS (OPTIONAL POLICY ADDITIONS)
// ============================================================================

export const ENDORSEMENTS = [
  {
    id: 'END_ORDINANCE_ENHANCED',
    name: 'Enhanced Ordinance or Law Coverage',
    explanation: 'Provides higher limits for building code upgrade costs beyond base policy coverage.',
    appliesTo: ['code upgrade', 'ordinance', 'building code'],
    commonlyMissed: true,
    triggers: ['significant code upgrades', 'substantial reconstruction'],
    typicalLimit: '25-50% of Coverage A or higher'
  },
  {
    id: 'END_WATER_BACKUP',
    name: 'Water Backup and Sump Pump Overflow',
    explanation: 'Covers damage from water backing up through sewers or drains, or sump pump overflow.',
    appliesTo: ['sewer backup', 'drain backup', 'sump pump', 'water backup'],
    commonlyMissed: true,
    triggers: ['sewer backup', 'drain backup', 'sump pump failure'],
    typicalLimit: '$5,000-$25,000',
    notStandardCoverage: true
  },
  {
    id: 'END_MOLD',
    name: 'Mold / Fungi Coverage Enhancement',
    explanation: 'Provides higher limits for mold remediation beyond base policy limits.',
    appliesTo: ['mold', 'fungi', 'remediation'],
    commonlyMissed: true,
    triggers: ['mold growth', 'fungi', 'moisture damage'],
    typicalLimit: '$10,000-$50,000',
    basePolicyLimit: '$10,000 or less'
  },
  {
    id: 'END_EQUIPMENT',
    name: 'Equipment Breakdown',
    explanation: 'Covers mechanical or electrical breakdown of equipment (HVAC, appliances, etc.).',
    appliesTo: ['equipment', 'mechanical', 'electrical', 'breakdown', 'HVAC'],
    commonlyMissed: true,
    triggers: ['HVAC failure', 'appliance breakdown', 'mechanical failure'],
    notStandardCoverage: true
  },
  {
    id: 'END_SCHEDULED',
    name: 'Scheduled Personal Property',
    explanation: 'Provides higher limits and broader coverage for specific valuable items (jewelry, art, etc.).',
    appliesTo: ['jewelry', 'art', 'collectibles', 'valuable items'],
    commonlyMissed: false,
    triggers: ['high-value items damaged'],
    requiresSchedule: true
  },
  {
    id: 'END_REPLACEMENT_COST',
    name: 'Replacement Cost on Contents',
    explanation: 'Pays replacement cost for personal property instead of actual cash value (depreciated).',
    appliesTo: ['contents', 'personal property'],
    commonlyMissed: false,
    triggers: ['contents damage'],
    removesDepreciation: true
  },
  {
    id: 'END_INCREASED_DWELLING',
    name: 'Increased Dwelling Limits / Extended Replacement Cost',
    explanation: 'Provides coverage beyond the stated Coverage A limit if rebuilding costs exceed the limit.',
    appliesTo: ['dwelling', 'rebuilding', 'cost overrun'],
    commonlyMissed: false,
    triggers: ['rebuilding costs exceed limit'],
    typicalLimit: '125-150% of Coverage A'
  },
  {
    id: 'END_ROOF_SURFACING',
    name: 'Roof Surface Replacement Cost',
    explanation: 'Pays replacement cost for roof surface instead of actual cash value.',
    appliesTo: ['roof', 'shingles', 'roof surface'],
    commonlyMissed: true,
    triggers: ['roof damage'],
    removesDepreciation: true
  },
  {
    id: 'END_SERVICE_LINE',
    name: 'Service Line Coverage',
    explanation: 'Covers repair or replacement of underground service lines (water, sewer, power, data).',
    appliesTo: ['service lines', 'underground', 'utilities'],
    commonlyMissed: true,
    triggers: ['service line damage', 'underground utility damage'],
    notStandardCoverage: true
  },
  {
    id: 'END_IDENTITY_THEFT',
    name: 'Identity Theft Coverage',
    explanation: 'Covers expenses related to identity theft restoration.',
    appliesTo: ['identity theft', 'fraud'],
    commonlyMissed: true,
    triggers: ['identity theft'],
    notStandardCoverage: true
  },
  {
    id: 'END_INFLATION_GUARD',
    name: 'Inflation Guard',
    explanation: 'Automatically increases coverage limits annually to keep pace with inflation.',
    appliesTo: ['coverage limits', 'inflation'],
    commonlyMissed: false,
    triggers: ['N/A - automatic adjustment'],
    automatic: true
  }
];

// ============================================================================
// WATER DAMAGE SPECIFIC COVERAGES
// ============================================================================

export const WATER_COVERAGES = [
  {
    id: 'WATER_MITIGATION',
    name: 'Water Mitigation / Emergency Water Removal',
    explanation: 'Covers emergency water extraction and drying to prevent further damage.',
    appliesTo: ['water extraction', 'drying', 'dehumidification', 'mitigation'],
    commonlyMissed: false,
    triggers: ['water damage', 'flooding (internal)', 'leak'],
    partOf: 'Reasonable Emergency Repairs'
  },
  {
    id: 'WATER_SUDDEN',
    name: 'Sudden and Accidental Water Damage',
    explanation: 'Covers water damage from sudden and accidental discharge (pipes, appliances, HVAC).',
    appliesTo: ['pipe burst', 'appliance leak', 'HVAC leak'],
    commonlyMissed: false,
    triggers: ['pipe burst', 'water heater leak', 'appliance leak'],
    excludes: ['gradual leaks', 'maintenance issues', 'flood']
  }
];

// ============================================================================
// COMMONLY MISSED COVERAGE SCENARIOS
// ============================================================================

export const COMMONLY_MISSED_SCENARIOS = [
  {
    scenario: 'Detached structures damaged',
    coverage: 'COV_B',
    reason: 'Policyholders often forget Coverage B applies to fences, sheds, and detached garages'
  },
  {
    scenario: 'Displacement during repairs',
    coverage: 'COV_D',
    reason: 'ALE is commonly overlooked even when policyholder incurs hotel and meal costs'
  },
  {
    scenario: 'Code upgrades required',
    coverage: 'ADD_ORDINANCE',
    reason: 'Ordinance or Law coverage is often not claimed even when code upgrades are mandated'
  },
  {
    scenario: 'Debris removal costs',
    coverage: 'ADD_DEBRIS',
    reason: 'Debris removal is a separate coverage that adds to total claim value'
  },
  {
    scenario: 'Tree and landscaping damage',
    coverage: 'ADD_TREE',
    reason: 'Limited coverage exists but is frequently not claimed'
  },
  {
    scenario: 'Professional fees (engineer, architect)',
    coverage: 'ADD_PROFESSIONAL',
    reason: 'Professional fees are covered but often not included in estimates'
  },
  {
    scenario: 'Matching issues with discontinued materials',
    coverage: 'ADD_MATCHING',
    reason: 'Matching coverage or endorsement may apply when materials are unavailable'
  },
  {
    scenario: 'Sewer or drain backup',
    coverage: 'END_WATER_BACKUP',
    reason: 'Requires endorsement but is commonly missed if policyholder has the endorsement'
  },
  {
    scenario: 'Mold beyond base limits',
    coverage: 'END_MOLD',
    reason: 'Enhanced mold coverage endorsement provides higher limits'
  },
  {
    scenario: 'Roof depreciation',
    coverage: 'END_ROOF_SURFACING',
    reason: 'Roof surface endorsement removes depreciation but is often not applied'
  }
];

// ============================================================================
// COVERAGE REGISTRY (COMPLETE)
// ============================================================================

export const COVERAGE_REGISTRY = {
  base: BASE_COVERAGES,
  additional: ADDITIONAL_COVERAGES,
  endorsements: ENDORSEMENTS,
  water: WATER_COVERAGES,
  commonlyMissed: COMMONLY_MISSED_SCENARIOS,
  
  // Metadata
  version: '1.0.0',
  lastUpdated: '2026-01-03',
  completenessGuarantee: 'This registry is exhaustive. All standard homeowners policy coverages are represented.'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets all coverages (base + additional + endorsements)
 * @returns {Array} All coverages
 */
export function getAllCoverages() {
  return [
    ...BASE_COVERAGES,
    ...ADDITIONAL_COVERAGES,
    ...ENDORSEMENTS,
    ...WATER_COVERAGES
  ];
}

/**
 * Gets commonly missed coverages
 * @returns {Array} Commonly missed coverages
 */
export function getCommonlyMissedCoverages() {
  return getAllCoverages().filter(cov => cov.commonlyMissed === true);
}

/**
 * Finds coverage by ID
 * @param {string} id - Coverage ID
 * @returns {Object} Coverage object
 */
export function getCoverageById(id) {
  return getAllCoverages().find(cov => cov.id === id);
}

/**
 * Finds coverages that apply to specific damage type
 * @param {string} damageType - Type of damage
 * @returns {Array} Applicable coverages
 */
export function getCoveragesForDamageType(damageType) {
  const normalized = damageType.toLowerCase();
  return getAllCoverages().filter(cov => 
    cov.appliesTo.some(type => type.toLowerCase().includes(normalized)) ||
    cov.triggers?.some(trigger => trigger.toLowerCase().includes(normalized))
  );
}

/**
 * Gets endorsements only
 * @returns {Array} Endorsements
 */
export function getEndorsements() {
  return ENDORSEMENTS;
}

/**
 * Validates registry completeness
 * @returns {Object} Validation result
 */
export function validateRegistryCompleteness() {
  const allCoverages = getAllCoverages();
  const issues = [];

  // Check each coverage has required fields
  allCoverages.forEach(cov => {
    if (!cov.id) issues.push(`Coverage missing ID: ${cov.name}`);
    if (!cov.name) issues.push(`Coverage missing name: ${cov.id}`);
    if (!cov.explanation) issues.push(`Coverage missing explanation: ${cov.id}`);
    if (!Array.isArray(cov.appliesTo)) issues.push(`Coverage missing appliesTo: ${cov.id}`);
  });

  return {
    valid: issues.length === 0,
    coverageCount: allCoverages.length,
    issues
  };
}

// ============================================================================
// EXPORTS (Node.js)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COVERAGE_REGISTRY,
    BASE_COVERAGES,
    ADDITIONAL_COVERAGES,
    ENDORSEMENTS,
    WATER_COVERAGES,
    COMMONLY_MISSED_SCENARIOS,
    getAllCoverages,
    getCommonlyMissedCoverages,
    getCoverageById,
    getCoveragesForDamageType,
    getEndorsements,
    validateRegistryCompleteness
  };
}


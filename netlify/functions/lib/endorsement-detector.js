/**
 * Endorsement Intelligence Engine
 * Detects policy endorsements and special provisions
 * Critical for claim coverage determination
 */

/**
 * Detect all endorsements in policy
 * @param {string} policyText - Normalized policy text
 * @param {string} endorsementsSection - Extracted endorsements section
 * @returns {object} Detected endorsements
 */
function detectEndorsements(policyText, endorsementsSection = null) {
  const text = endorsementsSection || policyText;
  
  return {
    // Coverage Endorsements
    matching_endorsement: detectMatchingEndorsement(text),
    functional_replacement_cost: detectFunctionalReplacementCost(text),
    agreed_value: detectAgreedValue(text),
    extended_replacement_cost: detectExtendedReplacementCost(text),
    guaranteed_replacement_cost: detectGuaranteedReplacementCost(text),
    
    // Exclusion/Limitation Endorsements
    cosmetic_exclusion: detectCosmeticExclusion(text),
    roof_acv_endorsement: detectRoofACVEndorsement(text),
    water_exclusion: detectWaterExclusion(text),
    mold_exclusion: detectMoldExclusion(text),
    
    // Special Provisions
    vacancy_clause: detectVacancyClause(text),
    ordinance_law_endorsement: detectOrdinanceLawEndorsement(text),
    
    // Commercial Endorsements
    blanket_coverage: detectBlanketCoverage(text),
    peak_season_endorsement: detectPeakSeasonEndorsement(text),
    building_ordinance_coverage: detectBuildingOrdinanceCoverage(text),
    
    // Additional Coverages
    equipment_breakdown: detectEquipmentBreakdown(text),
    service_line_coverage: detectServiceLineCoverage(text),
    identity_theft: detectIdentityTheft(text),
    
    // Raw endorsement list
    all_endorsements: extractAllEndorsementNames(text)
  };
}

/**
 * Detect Matching Endorsement
 */
function detectMatchingEndorsement(text) {
  const patterns = [
    /matching\s+endorsement/i,
    /undamaged\s+property\s+matching/i,
    /match\s+undamaged\s+portions/i,
    /matching\s+of\s+undamaged\s+property/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Functional Replacement Cost
 */
function detectFunctionalReplacementCost(text) {
  const patterns = [
    /functional\s+replacement\s+cost/i,
    /functional\s+equivalent/i,
    /functionally\s+equivalent\s+replacement/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Agreed Value
 */
function detectAgreedValue(text) {
  const patterns = [
    /agreed\s+value/i,
    /agreed\s+amount/i,
    /stated\s+value/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Extended Replacement Cost
 */
function detectExtendedReplacementCost(text) {
  const patterns = [
    /extended\s+replacement\s+cost/i,
    /extended\s+coverage/i,
    /(\d{3})%\s+extended\s+replacement/i
  ];
  
  const detected = patterns.some(pattern => pattern.test(text));
  
  // Extract percentage if present
  const percentMatch = text.match(/(\d{3})%\s+extended\s+replacement/i);
  const percentage = percentMatch ? parseInt(percentMatch[1]) : null;
  
  return {
    detected,
    percentage
  };
}

/**
 * Detect Guaranteed Replacement Cost
 */
function detectGuaranteedReplacementCost(text) {
  const patterns = [
    /guaranteed\s+replacement\s+cost/i,
    /guaranteed\s+rebuild/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Cosmetic Exclusion
 */
function detectCosmeticExclusion(text) {
  const patterns = [
    /cosmetic\s+damage\s+exclusion/i,
    /cosmetic\s+loss\s+exclusion/i,
    /exclude.*?cosmetic/i,
    /cosmetic\s+imperfection/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Roof ACV Endorsement
 */
function detectRoofACVEndorsement(text) {
  const patterns = [
    /roof\s+actual\s+cash\s+value/i,
    /roof\s+acv/i,
    /actual\s+cash\s+value\s+roof/i,
    /roof.*?depreciation/i,
    /roof\s+surface.*?acv/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Water Exclusion
 */
function detectWaterExclusion(text) {
  const patterns = [
    /water\s+damage\s+exclusion/i,
    /water.*?excluded/i,
    /exclude.*?water\s+damage/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Mold Exclusion
 */
function detectMoldExclusion(text) {
  const patterns = [
    /mold\s+exclusion/i,
    /fungus\s+exclusion/i,
    /exclude.*?mold/i,
    /exclude.*?fungus/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Vacancy Clause
 */
function detectVacancyClause(text) {
  const patterns = [
    /vacancy\s+clause/i,
    /vacant\s+more\s+than\s+(\d+)\s+days/i,
    /unoccupied\s+more\s+than\s+(\d+)\s+days/i,
    /vacancy.*?void/i
  ];
  
  const detected = patterns.some(pattern => pattern.test(text));
  
  // Extract day limit
  const dayMatch = text.match(/vacant\s+more\s+than\s+(\d+)\s+days/i) ||
                   text.match(/unoccupied\s+more\s+than\s+(\d+)\s+days/i);
  const dayLimit = dayMatch ? parseInt(dayMatch[1]) : null;
  
  return {
    detected,
    day_limit: dayLimit
  };
}

/**
 * Detect Ordinance & Law Endorsement
 */
function detectOrdinanceLawEndorsement(text) {
  const patterns = [
    /ordinance\s+(?:and|&|or)\s+law/i,
    /building\s+code\s+upgrade/i,
    /law\s+and\s+ordinance/i
  ];
  
  const detected = patterns.some(pattern => pattern.test(text));
  
  // Determine if percent or flat limit
  const percentMatch = text.match(/ordinance.*?(\d{1,2})%/i);
  const flatMatch = text.match(/ordinance.*?\$?([\d,]+)/i);
  
  let limitType = null;
  let limitValue = null;
  
  if (percentMatch) {
    limitType = 'percent';
    limitValue = parseFloat(percentMatch[1]);
  } else if (flatMatch) {
    limitType = 'flat';
    limitValue = parseFloat(flatMatch[1].replace(/,/g, ''));
  }
  
  return {
    detected,
    limit_type: limitType,
    limit_value: limitValue
  };
}

/**
 * Detect Blanket Coverage
 */
function detectBlanketCoverage(text) {
  const patterns = [
    /blanket\s+coverage/i,
    /blanket\s+limit/i,
    /blanket\s+insurance/i
  ];
  
  const detected = patterns.some(pattern => pattern.test(text));
  
  // Extract blanket limit
  const limitMatch = text.match(/blanket.*?\$?([\d,]+)/i);
  const limit = limitMatch ? parseFloat(limitMatch[1].replace(/,/g, '')) : null;
  
  return {
    detected,
    limit
  };
}

/**
 * Detect Peak Season Endorsement
 */
function detectPeakSeasonEndorsement(text) {
  const patterns = [
    /peak\s+season/i,
    /seasonal\s+increase/i,
    /peak\s+inventory/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Building Ordinance Coverage
 */
function detectBuildingOrdinanceCoverage(text) {
  const patterns = [
    /building\s+ordinance\s+coverage/i,
    /ordinance\s+coverage/i,
    /increased\s+cost\s+of\s+construction/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Equipment Breakdown
 */
function detectEquipmentBreakdown(text) {
  const patterns = [
    /equipment\s+breakdown/i,
    /mechanical\s+breakdown/i,
    /boiler\s+and\s+machinery/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Service Line Coverage
 */
function detectServiceLineCoverage(text) {
  const patterns = [
    /service\s+line/i,
    /exterior\s+service\s+line/i,
    /underground\s+service\s+line/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Identity Theft Coverage
 */
function detectIdentityTheft(text) {
  const patterns = [
    /identity\s+theft/i,
    /identity\s+fraud/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Extract all endorsement names
 */
function extractAllEndorsementNames(text) {
  const endorsements = [];
  
  // Pattern: ENDORSEMENT followed by name
  const pattern = /(?:ENDORSEMENT|FORM)[:\s]+([A-Z][A-Z\s&-]+?)(?:\n|POLICY|THIS|THE|WE|YOU|COVERAGE|$)/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length > 5 && name.length < 100) {
      endorsements.push(name);
    }
  }
  
  return endorsements;
}

/**
 * Categorize endorsement impact
 * @param {object} endorsements - Detected endorsements
 * @returns {object} Categorized impact
 */
function categorizeEndorsementImpact(endorsements) {
  return {
    coverage_enhancing: [
      endorsements.matching_endorsement && 'Matching Endorsement',
      endorsements.extended_replacement_cost.detected && 'Extended Replacement Cost',
      endorsements.guaranteed_replacement_cost && 'Guaranteed Replacement Cost',
      endorsements.ordinance_law_endorsement.detected && 'Ordinance & Law',
      endorsements.equipment_breakdown && 'Equipment Breakdown',
      endorsements.service_line_coverage && 'Service Line'
    ].filter(Boolean),
    
    coverage_limiting: [
      endorsements.cosmetic_exclusion && 'Cosmetic Exclusion',
      endorsements.roof_acv_endorsement && 'Roof ACV',
      endorsements.water_exclusion && 'Water Exclusion',
      endorsements.mold_exclusion && 'Mold Exclusion',
      endorsements.vacancy_clause.detected && 'Vacancy Clause'
    ].filter(Boolean),
    
    special_provisions: [
      endorsements.agreed_value && 'Agreed Value',
      endorsements.functional_replacement_cost && 'Functional Replacement Cost',
      endorsements.blanket_coverage.detected && 'Blanket Coverage',
      endorsements.peak_season_endorsement && 'Peak Season'
    ].filter(Boolean)
  };
}

module.exports = {
  detectEndorsements,
  detectMatchingEndorsement,
  detectFunctionalReplacementCost,
  detectAgreedValue,
  detectExtendedReplacementCost,
  detectGuaranteedReplacementCost,
  detectCosmeticExclusion,
  detectRoofACVEndorsement,
  detectWaterExclusion,
  detectMoldExclusion,
  detectVacancyClause,
  detectOrdinanceLawEndorsement,
  detectBlanketCoverage,
  detectPeakSeasonEndorsement,
  detectBuildingOrdinanceCoverage,
  detectEquipmentBreakdown,
  detectServiceLineCoverage,
  detectIdentityTheft,
  extractAllEndorsementNames,
  categorizeEndorsementImpact
};

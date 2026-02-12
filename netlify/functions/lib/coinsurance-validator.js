/**
 * Coinsurance Validator
 * Calculates coinsurance penalty risk
 * Critical for commercial property claims
 */

/**
 * Validate coinsurance compliance
 * @param {number} buildingLimit - Policy building limit
 * @param {number} coinsurancePercent - Coinsurance percentage (80, 90, 100)
 * @param {number} replacementCost - Estimated replacement cost
 * @returns {object} Validation results
 */
function validateCoinsurance(buildingLimit, coinsurancePercent, replacementCost) {
  // Validate inputs
  if (!buildingLimit || !coinsurancePercent || !replacementCost) {
    return {
      coinsurance_penalty_risk: false,
      required_limit: null,
      shortfall: null,
      penalty_percentage: null,
      error: 'Missing required inputs'
    };
  }
  
  // Calculate required limit
  const requiredLimit = replacementCost * (coinsurancePercent / 100);
  
  // Calculate shortfall
  const shortfall = Math.max(0, requiredLimit - buildingLimit);
  
  // Determine if penalty applies
  const penaltyRisk = shortfall > 0;
  
  // Calculate penalty percentage (what % of claim will be paid)
  let penaltyPercentage = 100;
  if (penaltyRisk) {
    penaltyPercentage = (buildingLimit / requiredLimit) * 100;
  }
  
  // Calculate recovery ceiling (max recoverable amount)
  const recoveryCeiling = penaltyRisk 
    ? buildingLimit 
    : replacementCost;
  
  return {
    coinsurance_penalty_risk: penaltyRisk,
    required_limit: parseFloat(requiredLimit.toFixed(2)),
    shortfall: parseFloat(shortfall.toFixed(2)),
    penalty_percentage: parseFloat(penaltyPercentage.toFixed(2)),
    recovery_ceiling: parseFloat(recoveryCeiling.toFixed(2)),
    compliance_ratio: parseFloat((buildingLimit / requiredLimit).toFixed(4))
  };
}

/**
 * Calculate adjusted claim payment with coinsurance penalty
 * @param {number} lossAmount - Actual loss amount
 * @param {number} buildingLimit - Policy building limit
 * @param {number} coinsurancePercent - Coinsurance percentage
 * @param {number} replacementCost - Estimated replacement cost
 * @param {number} deductible - Policy deductible
 * @returns {object} Payment calculation
 */
function calculateCoinsurancePayment(lossAmount, buildingLimit, coinsurancePercent, replacementCost, deductible = 0) {
  const validation = validateCoinsurance(buildingLimit, coinsurancePercent, replacementCost);
  
  let paymentAmount;
  
  if (validation.coinsurance_penalty_risk) {
    // Apply coinsurance penalty
    // Formula: (Amount of Insurance Carried / Amount of Insurance Required) × Loss Amount
    paymentAmount = (buildingLimit / validation.required_limit) * lossAmount;
    
    // Cap at building limit
    paymentAmount = Math.min(paymentAmount, buildingLimit);
  } else {
    // No penalty - pay full loss up to limit
    paymentAmount = Math.min(lossAmount, buildingLimit);
  }
  
  // Subtract deductible
  paymentAmount = Math.max(0, paymentAmount - deductible);
  
  // Calculate penalty impact
  const fullPayment = Math.min(lossAmount, buildingLimit) - deductible;
  const penaltyImpact = fullPayment - paymentAmount;
  
  return {
    loss_amount: parseFloat(lossAmount.toFixed(2)),
    payment_amount: parseFloat(paymentAmount.toFixed(2)),
    penalty_applied: validation.coinsurance_penalty_risk,
    penalty_impact: parseFloat(penaltyImpact.toFixed(2)),
    deductible_applied: parseFloat(deductible.toFixed(2)),
    recovery_percentage: parseFloat((paymentAmount / lossAmount * 100).toFixed(2))
  };
}

/**
 * Check if Agreed Value endorsement waives coinsurance
 * @param {boolean} agreedValue - Agreed Value endorsement present
 * @param {boolean} coinsuranceClause - Coinsurance clause present
 * @returns {object} Waiver status
 */
function checkCoinsuranceWaiver(agreedValue, coinsuranceClause) {
  if (agreedValue && coinsuranceClause) {
    return {
      waived: true,
      reason: 'Agreed Value endorsement waives coinsurance requirement',
      penalty_risk: false
    };
  }
  
  if (!coinsuranceClause) {
    return {
      waived: true,
      reason: 'No coinsurance clause in policy',
      penalty_risk: false
    };
  }
  
  return {
    waived: false,
    reason: 'Coinsurance clause applies',
    penalty_risk: true
  };
}

/**
 * Generate coinsurance compliance recommendation
 * @param {object} validation - Validation results
 * @returns {object} Recommendation
 */
function generateCoinsuranceRecommendation(validation) {
  if (!validation.coinsurance_penalty_risk) {
    return {
      priority: 'low',
      title: 'Coinsurance Compliant',
      message: 'Policy limit meets coinsurance requirement. No penalty risk.',
      action: null
    };
  }
  
  const shortfallPercent = (validation.shortfall / validation.required_limit * 100).toFixed(1);
  
  return {
    priority: 'critical',
    title: 'Coinsurance Penalty Risk',
    message: `Building limit is ${shortfallPercent}% below coinsurance requirement. Claim payment will be reduced to ${validation.penalty_percentage.toFixed(1)}% of loss amount.`,
    action: 'Request policy amendment or prepare for reduced recovery',
    shortfall: validation.shortfall,
    required_limit: validation.required_limit
  };
}

/**
 * Calculate coinsurance for blanket coverage
 * @param {number} blanketLimit - Total blanket limit
 * @param {number} coinsurancePercent - Coinsurance percentage
 * @param {array} locations - Array of location replacement costs
 * @returns {object} Blanket coinsurance validation
 */
function validateBlanketCoinsurance(blanketLimit, coinsurancePercent, locations) {
  // Sum all location replacement costs
  const totalReplacementCost = locations.reduce((sum, loc) => sum + (loc.replacement_cost || 0), 0);
  
  // Apply standard coinsurance validation
  const validation = validateCoinsurance(blanketLimit, coinsurancePercent, totalReplacementCost);
  
  return {
    ...validation,
    blanket_coverage: true,
    location_count: locations.length,
    total_replacement_cost: parseFloat(totalReplacementCost.toFixed(2))
  };
}

module.exports = {
  validateCoinsurance,
  calculateCoinsurancePayment,
  checkCoinsuranceWaiver,
  generateCoinsuranceRecommendation,
  validateBlanketCoinsurance
};

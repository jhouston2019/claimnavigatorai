/**
 * Depreciation Validator
 * Detects and validates depreciation calculations
 */

/**
 * Detect depreciation in estimate
 * @param {Array} lineItems - Parsed line items
 * @param {number} grandTotal - Grand total from estimate
 * @returns {object} Depreciation detection results
 */
function detectDepreciation(lineItems, grandTotal) {
  let depreciationAmount = 0;
  let depreciationPercent = null;
  let rcvTotal = 0;
  let acvTotal = 0;
  const depreciationLines = [];
  
  for (const item of lineItems) {
    const desc = item.description.toLowerCase();
    
    // Detect depreciation line
    if (desc.includes('depreciation') || desc.includes('depr') || 
        desc.includes('withheld') || desc.includes('holdback')) {
      depreciationLines.push(item);
      depreciationAmount += Math.abs(item.total || 0);
      
      // Try to extract percentage
      const percentMatch = desc.match(/(\d+(?:\.\d+)?)\s*%/);
      if (percentMatch) {
        depreciationPercent = parseFloat(percentMatch[1]);
      }
    }
    
    // Detect RCV (Replacement Cost Value)
    if (desc.includes('rcv') || desc.includes('replacement cost')) {
      rcvTotal += item.total || 0;
    }
    
    // Detect ACV (Actual Cash Value)
    if (desc.includes('acv') || desc.includes('actual cash value')) {
      acvTotal += item.total || 0;
    }
  }
  
  // If we have RCV and ACV, calculate depreciation
  if (rcvTotal > 0 && acvTotal > 0) {
    depreciationAmount = rcvTotal - acvTotal;
    depreciationPercent = (depreciationAmount / rcvTotal) * 100;
  }
  
  // If we have depreciation amount but no RCV/ACV, estimate from grand total
  if (depreciationAmount > 0 && rcvTotal === 0) {
    rcvTotal = grandTotal + depreciationAmount;
    acvTotal = grandTotal;
  }
  
  return {
    has_depreciation: depreciationAmount > 0,
    depreciation_amount: parseFloat(depreciationAmount.toFixed(2)),
    depreciation_percent: depreciationPercent ? parseFloat(depreciationPercent.toFixed(2)) : null,
    rcv_total: parseFloat(rcvTotal.toFixed(2)),
    acv_total: parseFloat(acvTotal.toFixed(2)),
    depreciation_withheld: parseFloat(depreciationAmount.toFixed(2)),
    depreciation_recoverable: parseFloat(depreciationAmount.toFixed(2)), // Assume all is recoverable
    depreciation_lines: depreciationLines.map(item => ({
      line_number: item.line_number,
      description: item.description,
      amount: item.total
    }))
  };
}

/**
 * Validate depreciation calculation
 * @param {object} carrierDepreciation - Carrier depreciation data
 * @param {object} contractorData - Contractor estimate data
 * @param {object} policyData - Policy coverage data
 * @returns {object} Validation results
 */
function validateDepreciation(carrierDepreciation, contractorData, policyData = {}) {
  const issues = [];
  const recommendations = [];
  
  // Check if depreciation rate is reasonable
  if (carrierDepreciation.depreciation_percent) {
    const rate = carrierDepreciation.depreciation_percent;
    
    // Typical depreciation rates
    if (rate > 50) {
      issues.push({
        type: 'excessive_depreciation',
        severity: 'high',
        message: `Depreciation rate of ${rate}% is unusually high. Industry standard is typically 20-40%.`,
        impact: carrierDepreciation.depreciation_amount * 0.3 // Estimate 30% of depreciation may be excessive
      });
      recommendations.push(`Request justification for ${rate}% depreciation rate or adjustment to industry standard (25-30%).`);
    }
    
    if (rate < 10 && carrierDepreciation.depreciation_amount > 1000) {
      issues.push({
        type: 'low_depreciation',
        severity: 'low',
        message: `Depreciation rate of ${rate}% is unusually low for significant claim.`,
        impact: 0
      });
    }
  }
  
  // Check if depreciation is applied to non-depreciable items
  if (policyData.settlement_type === 'RCV') {
    issues.push({
      type: 'rcv_policy_depreciation',
      severity: 'critical',
      message: 'Policy is RCV (Replacement Cost Value) but carrier applied depreciation. This may be incorrect.',
      impact: carrierDepreciation.depreciation_amount
    });
    recommendations.push('Review policy terms. RCV policies typically do not apply depreciation to covered items.');
  }
  
  // Check if depreciation calculation is correct
  if (carrierDepreciation.rcv_total > 0 && carrierDepreciation.acv_total > 0) {
    const calculatedDepreciation = carrierDepreciation.rcv_total - carrierDepreciation.acv_total;
    const difference = Math.abs(calculatedDepreciation - carrierDepreciation.depreciation_amount);
    
    if (difference > 10) {
      issues.push({
        type: 'depreciation_math_error',
        severity: 'high',
        message: `Depreciation calculation appears incorrect. RCV - ACV = $${calculatedDepreciation.toFixed(2)}, but depreciation listed as $${carrierDepreciation.depreciation_amount.toFixed(2)}`,
        impact: difference
      });
      recommendations.push('Request carrier to correct depreciation calculation.');
    }
  }
  
  // Calculate total impact
  const totalImpact = issues.reduce((sum, issue) => sum + (issue.impact || 0), 0);
  
  return {
    valid: issues.length === 0,
    issues,
    recommendations,
    total_impact: parseFloat(totalImpact.toFixed(2)),
    depreciation_summary: {
      applied: carrierDepreciation.depreciation_amount,
      withheld: carrierDepreciation.depreciation_withheld,
      recoverable: carrierDepreciation.depreciation_recoverable,
      rate: carrierDepreciation.depreciation_percent
    }
  };
}

/**
 * Calculate depreciation by category
 * @param {Array} lineItems - Line items with depreciation
 * @param {object} categoryBreakdown - Category breakdown from reconciler
 * @returns {object} Depreciation by category
 */
function calculateDepreciationByCategory(lineItems, categoryBreakdown) {
  const depreciationByCategory = {};
  
  // Estimate depreciation per category based on typical rates
  const typicalRates = {
    'Roofing': 0.25,      // 25% depreciation typical
    'Siding': 0.20,       // 20% depreciation typical
    'Interior': 0.15,     // 15% depreciation typical
    'Flooring': 0.20,     // 20% depreciation typical
    'Windows/Doors': 0.15,
    'Electrical': 0.10,
    'Plumbing/HVAC': 0.10,
    'Other': 0.20
  };
  
  for (const [category, data] of Object.entries(categoryBreakdown)) {
    const rate = typicalRates[category] || 0.20;
    const estimatedDepreciation = data.carrier_total * rate;
    
    depreciationByCategory[category] = {
      carrier_total: data.carrier_total,
      estimated_depreciation: parseFloat(estimatedDepreciation.toFixed(2)),
      depreciation_rate: rate * 100,
      recoverable_amount: parseFloat(estimatedDepreciation.toFixed(2))
    };
  }
  
  return depreciationByCategory;
}

/**
 * Generate depreciation recovery strategy
 * @param {object} depreciationData - Depreciation validation data
 * @returns {object} Recovery strategy
 */
function generateRecoveryStrategy(depreciationData) {
  const strategy = {
    immediate_actions: [],
    documentation_needed: [],
    negotiation_points: [],
    estimated_recovery: 0
  };
  
  if (depreciationData.issues.length > 0) {
    for (const issue of depreciationData.issues) {
      switch (issue.type) {
        case 'excessive_depreciation':
          strategy.immediate_actions.push('Challenge depreciation rate with carrier');
          strategy.documentation_needed.push('Industry standard depreciation schedules');
          strategy.negotiation_points.push(`Request reduction from ${depreciationData.depreciation_summary.rate}% to industry standard 25-30%`);
          strategy.estimated_recovery += issue.impact;
          break;
        
        case 'rcv_policy_depreciation':
          strategy.immediate_actions.push('Review policy declarations page');
          strategy.documentation_needed.push('Policy showing RCV coverage');
          strategy.negotiation_points.push('Demand full RCV payment per policy terms');
          strategy.estimated_recovery += issue.impact;
          break;
        
        case 'depreciation_math_error':
          strategy.immediate_actions.push('Request corrected depreciation calculation');
          strategy.documentation_needed.push('Carrier\'s depreciation worksheet');
          strategy.negotiation_points.push('Correct mathematical error in depreciation calculation');
          strategy.estimated_recovery += issue.impact;
          break;
      }
    }
  }
  
  // Add standard recovery actions
  strategy.immediate_actions.push('Complete repairs to trigger depreciation release');
  strategy.documentation_needed.push('Proof of completion (photos, invoices, certificates)');
  strategy.negotiation_points.push('Request depreciation holdback release upon completion');
  
  strategy.estimated_recovery = parseFloat(strategy.estimated_recovery.toFixed(2));
  
  return strategy;
}

module.exports = {
  detectDepreciation,
  validateDepreciation,
  calculateDepreciationByCategory,
  generateRecoveryStrategy
};

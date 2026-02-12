/**
 * Policy Trigger Engine
 * Cross-references policy coverage with estimate discrepancies
 * Identifies coverage-based recovery opportunities
 */

/**
 * Calculate policy triggers
 * @param {object} policyCoverage - Policy coverage data
 * @param {Array} discrepancies - Estimate discrepancies
 * @param {object} comparison - Estimate comparison data
 * @returns {object} Trigger analysis
 */
function calculatePolicyTriggers(policyCoverage, discrepancies, comparison) {
  const triggers = {
    ordinance_trigger: false,
    ordinance_trigger_amount: 0,
    ordinance_trigger_note: null,
    
    matching_trigger: false,
    matching_trigger_note: null,
    
    depreciation_trigger: false,
    depreciation_trigger_note: null,
    
    sublimit_trigger: false,
    sublimit_trigger_type: null,
    sublimit_trigger_amount: 0,
    sublimit_trigger_note: null,
    
    settlement_type_trigger: false,
    settlement_type_trigger_note: null,
    
    coverage_limit_trigger: false,
    coverage_limit_trigger_note: null
  };
  
  // =====================================================
  // TRIGGER 1: ORDINANCE & LAW
  // =====================================================
  if (policyCoverage.ordinance_law_percent > 0) {
    // Check if estimate contains code upgrade items
    const codeUpgradeDiscrepancies = discrepancies.filter(d => 
      d.category === 'Code Upgrade' || 
      d.line_item_description?.toLowerCase().includes('code') ||
      d.line_item_description?.toLowerCase().includes('upgrade') ||
      d.line_item_description?.toLowerCase().includes('ordinance')
    );
    
    if (codeUpgradeDiscrepancies.length > 0) {
      const codeUpgradeAmount = codeUpgradeDiscrepancies.reduce(
        (sum, d) => sum + (d.contractor_total || 0), 0
      );
      
      // Calculate ordinance coverage available
      const dwellingLimit = policyCoverage.dwelling_limit || 0;
      const ordinanceLimit = policyCoverage.ordinance_law_limit || 
        (dwellingLimit * (policyCoverage.ordinance_law_percent / 100));
      
      triggers.ordinance_trigger = true;
      triggers.ordinance_trigger_amount = Math.min(codeUpgradeAmount, ordinanceLimit);
      triggers.ordinance_trigger_note = `Ordinance & Law coverage at ${policyCoverage.ordinance_law_percent}% applies to code upgrade items totaling $${codeUpgradeAmount.toFixed(2)}. Coverage available: $${ordinanceLimit.toFixed(2)}`;
    }
  }
  
  // =====================================================
  // TRIGGER 2: MATCHING ENDORSEMENT
  // =====================================================
  if (policyCoverage.matching_endorsement) {
    // Check if partial repairs are in scope
    const partialRepairKeywords = ['partial', 'match', 'blend', 'adjacent', 'undamaged'];
    const matchingDiscrepancies = discrepancies.filter(d =>
      partialRepairKeywords.some(keyword => 
        d.line_item_description?.toLowerCase().includes(keyword)
      )
    );
    
    if (matchingDiscrepancies.length > 0) {
      triggers.matching_trigger = true;
      triggers.matching_trigger_note = `Matching endorsement applies. Carrier must cover cost to match undamaged portions of property for ${matchingDiscrepancies.length} items.`;
    }
  }
  
  // =====================================================
  // TRIGGER 3: DEPRECIATION / SETTLEMENT TYPE
  // =====================================================
  if (policyCoverage.settlement_type === 'RCV' && !policyCoverage.roof_acv_endorsement) {
    // RCV policy should not have depreciation on non-roof items
    const depreciationApplied = comparison?.category_breakdown 
      ? Object.values(comparison.category_breakdown).some(cat => 
          cat.carrier_total < cat.contractor_total
        )
      : false;
    
    if (depreciationApplied) {
      triggers.depreciation_trigger = true;
      triggers.depreciation_trigger_note = `Policy provides Replacement Cost Value (RCV) coverage. Depreciation should not be applied to covered items (except roof if ACV endorsement exists).`;
    }
  }
  
  if (policyCoverage.roof_acv_endorsement) {
    // Roof depreciation is expected
    const roofDiscrepancies = discrepancies.filter(d => 
      d.category === 'Roofing' || d.line_item_description?.toLowerCase().includes('roof')
    );
    
    if (roofDiscrepancies.length > 0) {
      triggers.depreciation_trigger = true;
      triggers.depreciation_trigger_note = `Roof ACV endorsement detected. Depreciation on roofing items is expected, but non-roof items should receive RCV.`;
    }
  }
  
  // =====================================================
  // TRIGGER 4: SUBLIMITS
  // =====================================================
  
  // Water sublimit
  if (policyCoverage.water_sublimit) {
    const waterDiscrepancies = discrepancies.filter(d =>
      d.line_item_description?.toLowerCase().includes('water') ||
      d.category === 'Plumbing/HVAC'
    );
    
    if (waterDiscrepancies.length > 0) {
      const waterTotal = waterDiscrepancies.reduce(
        (sum, d) => sum + (d.contractor_total || 0), 0
      );
      
      if (waterTotal > policyCoverage.water_sublimit) {
        triggers.sublimit_trigger = true;
        triggers.sublimit_trigger_type = 'water';
        triggers.sublimit_trigger_amount = policyCoverage.water_sublimit;
        triggers.sublimit_trigger_note = `Water damage sublimit of $${policyCoverage.water_sublimit.toFixed(2)} may cap recovery. Total water-related scope: $${waterTotal.toFixed(2)}`;
      }
    }
  }
  
  // Mold sublimit
  if (policyCoverage.mold_sublimit) {
    const moldDiscrepancies = discrepancies.filter(d =>
      d.line_item_description?.toLowerCase().includes('mold') ||
      d.line_item_description?.toLowerCase().includes('fungus')
    );
    
    if (moldDiscrepancies.length > 0) {
      const moldTotal = moldDiscrepancies.reduce(
        (sum, d) => sum + (d.contractor_total || 0), 0
      );
      
      if (moldTotal > policyCoverage.mold_sublimit) {
        triggers.sublimit_trigger = true;
        triggers.sublimit_trigger_type = 'mold';
        triggers.sublimit_trigger_amount = policyCoverage.mold_sublimit;
        triggers.sublimit_trigger_note = `Mold sublimit of $${policyCoverage.mold_sublimit.toFixed(2)} may cap recovery. Total mold-related scope: $${moldTotal.toFixed(2)}`;
      }
    }
  }
  
  // =====================================================
  // TRIGGER 5: COVERAGE LIMITS
  // =====================================================
  const totalContractorEstimate = comparison?.contractor_total || 0;
  const dwellingLimit = policyCoverage.dwelling_limit || 0;
  
  if (totalContractorEstimate > dwellingLimit && dwellingLimit > 0) {
    triggers.coverage_limit_trigger = true;
    triggers.coverage_limit_trigger_note = `Total contractor estimate ($${totalContractorEstimate.toFixed(2)}) exceeds Coverage A dwelling limit ($${dwellingLimit.toFixed(2)}). Review policy for extended replacement cost or other applicable endorsements.`;
  }
  
  return triggers;
}

/**
 * Generate policy-based supplement recommendations
 * @param {object} triggers - Policy triggers
 * @param {object} policyCoverage - Policy coverage data
 * @returns {Array} Recommendations
 */
function generatePolicyRecommendations(triggers, policyCoverage) {
  const recommendations = [];
  
  if (triggers.ordinance_trigger) {
    recommendations.push({
      priority: 'high',
      category: 'ordinance_law',
      title: 'Ordinance & Law Coverage Applies',
      description: triggers.ordinance_trigger_note,
      action: `Include in supplement: "Per Ordinance & Law endorsement at ${policyCoverage.ordinance_law_percent}%, carrier must cover code upgrade costs up to $${triggers.ordinance_trigger_amount.toFixed(2)}"`,
      estimated_recovery: triggers.ordinance_trigger_amount
    });
  }
  
  if (triggers.matching_trigger) {
    recommendations.push({
      priority: 'medium',
      category: 'matching',
      title: 'Matching Endorsement Applies',
      description: triggers.matching_trigger_note,
      action: 'Include in supplement: "Per matching endorsement, carrier must cover cost to match undamaged portions"',
      estimated_recovery: null
    });
  }
  
  if (triggers.depreciation_trigger) {
    recommendations.push({
      priority: 'high',
      category: 'depreciation',
      title: 'Settlement Type Issue',
      description: triggers.depreciation_trigger_note,
      action: policyCoverage.settlement_type === 'RCV' 
        ? 'Challenge depreciation application on RCV policy'
        : 'Request depreciation holdback release upon completion',
      estimated_recovery: null
    });
  }
  
  if (triggers.sublimit_trigger) {
    recommendations.push({
      priority: 'critical',
      category: 'sublimit',
      title: `${triggers.sublimit_trigger_type.toUpperCase()} Sublimit May Cap Recovery`,
      description: triggers.sublimit_trigger_note,
      action: `Review ${triggers.sublimit_trigger_type} damage scope. Consider alternative coverage sources or negotiate sublimit increase.`,
      estimated_recovery: null
    });
  }
  
  if (triggers.coverage_limit_trigger) {
    recommendations.push({
      priority: 'critical',
      category: 'coverage_limit',
      title: 'Coverage Limit Exceeded',
      description: triggers.coverage_limit_trigger_note,
      action: 'Review policy for extended replacement cost endorsement or other applicable coverage extensions',
      estimated_recovery: null
    });
  }
  
  return recommendations;
}

module.exports = {
  calculatePolicyTriggers,
  generatePolicyRecommendations
};

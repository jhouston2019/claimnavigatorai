/**
 * Code Upgrade Detection Engine
 * Deterministic detection of building code compliance issues
 * Quantifies code upgrade exposure
 * 
 * NO AI - Pure rule-based logic
 */

/**
 * Analyze estimate for code upgrade requirements
 * @param {object} params - Input parameters
 * @returns {object} Code upgrade analysis
 */
function analyzeCodeUpgrades(params) {
  const {
    lineItems = [],
    reconciliation = {},
    exposure = {},
    propertyMetadata = {},
    regionalData = {}
  } = params;
  
  const codeUpgradeFlags = [];
  let totalCodeUpgradeExposure = 0;
  
  // =====================================================
  // RULE 1: ROOF 25% REPLACEMENT RULE
  // =====================================================
  const roof25Rule = checkRoof25PercentRule(lineItems, propertyMetadata);
  if (roof25Rule.triggered) {
    codeUpgradeFlags.push(roof25Rule);
    totalCodeUpgradeExposure += roof25Rule.estimatedCostImpact;
  }
  
  // =====================================================
  // RULE 2: MISSING DRIP EDGE
  // =====================================================
  const dripEdge = checkDripEdge(lineItems);
  if (dripEdge.triggered) {
    codeUpgradeFlags.push(dripEdge);
    totalCodeUpgradeExposure += dripEdge.estimatedCostImpact;
  }
  
  // =====================================================
  // RULE 3: ICE & WATER SHIELD
  // =====================================================
  const iceShield = checkIceAndWaterShield(lineItems, regionalData);
  if (iceShield.triggered) {
    codeUpgradeFlags.push(iceShield);
    totalCodeUpgradeExposure += iceShield.estimatedCostImpact;
  }
  
  // =====================================================
  // RULE 4: VENTILATION COMPLIANCE
  // =====================================================
  const ventilation = checkVentilationCompliance(lineItems);
  if (ventilation.triggered) {
    codeUpgradeFlags.push(ventilation);
    totalCodeUpgradeExposure += ventilation.estimatedCostImpact;
  }
  
  // =====================================================
  // RULE 5: INSULATION R-VALUE UPGRADE
  // =====================================================
  const insulation = checkInsulationRValue(lineItems, regionalData);
  if (insulation.triggered) {
    codeUpgradeFlags.push(insulation);
    totalCodeUpgradeExposure += insulation.estimatedCostImpact;
  }
  
  // =====================================================
  // RULE 6: ELECTRICAL CODE UPGRADES
  // =====================================================
  const electrical = checkElectricalCodeUpgrades(lineItems);
  if (electrical.triggered) {
    codeUpgradeFlags.push(electrical);
    totalCodeUpgradeExposure += electrical.estimatedCostImpact;
  }
  
  // =====================================================
  // RULE 7: PLUMBING CODE UPGRADES
  // =====================================================
  const plumbing = checkPlumbingCodeUpgrades(lineItems);
  if (plumbing.triggered) {
    codeUpgradeFlags.push(plumbing);
    totalCodeUpgradeExposure += plumbing.estimatedCostImpact;
  }
  
  return {
    codeUpgradeFlags: codeUpgradeFlags,
    totalCodeUpgradeExposure: parseFloat(totalCodeUpgradeExposure.toFixed(2)),
    flagCount: codeUpgradeFlags.length,
    metadata: {
      engine_version: '1.0',
      calculation_method: 'deterministic',
      rules_evaluated: 7
    }
  };
}

/**
 * Check Roof 25% Replacement Rule
 * If 25%+ of roof is damaged, full replacement may be required
 */
function checkRoof25PercentRule(lineItems, propertyMetadata) {
  const roofingItems = lineItems.filter(item => 
    item.category === 'Roofing' || 
    item.description?.toLowerCase().includes('roof') ||
    item.description?.toLowerCase().includes('shingle')
  );
  
  if (roofingItems.length === 0) {
    return { triggered: false };
  }
  
  // Calculate total roofing quantity
  let totalRoofingQuantity = 0;
  let totalRoofingCost = 0;
  
  for (const item of roofingItems) {
    const unit = item.unit?.toUpperCase();
    if (unit === 'SQ' || unit === 'SF') {
      totalRoofingQuantity += item.quantity || 0;
      totalRoofingCost += item.rcv_total || item.total || 0;
    }
  }
  
  // Estimate total roof size (if not provided)
  const estimatedTotalRoofSize = propertyMetadata.roof_size || (totalRoofingQuantity * 4); // Assume repair is 25%
  const percentageAffected = (totalRoofingQuantity / estimatedTotalRoofSize) * 100;
  
  // Trigger if 25%+ affected
  if (percentageAffected >= 25) {
    // Estimate full replacement cost
    const avgCostPerSQ = totalRoofingCost / totalRoofingQuantity;
    const fullReplacementCost = estimatedTotalRoofSize * avgCostPerSQ;
    const additionalCost = fullReplacementCost - totalRoofingCost;
    
    return {
      triggered: true,
      issue: 'Roof 25% Rule Triggered',
      category: 'code_compliance',
      priority: 'high',
      explanation: `${percentageAffected.toFixed(1)}% of roof affected (${totalRoofingQuantity} SQ of estimated ${estimatedTotalRoofSize} SQ). Building codes require full roof replacement when 25%+ is damaged.`,
      estimatedCostImpact: parseFloat(additionalCost.toFixed(2)),
      calculation: {
        quantity_affected: totalRoofingQuantity,
        estimated_total_roof_size: estimatedTotalRoofSize,
        percentage_affected: parseFloat(percentageAffected.toFixed(2)),
        current_cost: totalRoofingCost,
        full_replacement_cost: fullReplacementCost,
        additional_cost: additionalCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Check for missing drip edge
 */
function checkDripEdge(lineItems) {
  const hasRoofing = lineItems.some(item => 
    item.category === 'Roofing' || 
    item.description?.toLowerCase().includes('shingle')
  );
  
  const hasDripEdge = lineItems.some(item =>
    item.description?.toLowerCase().includes('drip edge') ||
    item.description?.toLowerCase().includes('drip-edge')
  );
  
  if (hasRoofing && !hasDripEdge) {
    // Estimate drip edge cost (industry standard: $2-3 per LF)
    const estimatedPerimeter = 150; // Average home perimeter in LF
    const costPerLF = 2.50;
    const estimatedCost = estimatedPerimeter * costPerLF;
    
    return {
      triggered: true,
      issue: 'Missing Drip Edge',
      category: 'code_compliance',
      priority: 'medium',
      explanation: 'Roofing work detected but drip edge not included in carrier estimate. Modern building codes require drip edge installation with roof replacement.',
      estimatedCostImpact: parseFloat(estimatedCost.toFixed(2)),
      calculation: {
        estimated_perimeter_lf: estimatedPerimeter,
        cost_per_lf: costPerLF,
        total_cost: estimatedCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Check for ice & water shield requirement
 */
function checkIceAndWaterShield(lineItems, regionalData) {
  const hasRoofing = lineItems.some(item => 
    item.category === 'Roofing' || 
    item.description?.toLowerCase().includes('shingle')
  );
  
  const hasIceShield = lineItems.some(item =>
    item.description?.toLowerCase().includes('ice') ||
    item.description?.toLowerCase().includes('water shield') ||
    item.description?.toLowerCase().includes('ice barrier')
  );
  
  // Check if region requires ice barrier (cold climate)
  const requiresIceBarrier = regionalData.climate === 'cold' || 
                             regionalData.state?.match(/^(AK|ME|VT|NH|MN|WI|MI|ND|SD|MT|WY)$/i);
  
  if (hasRoofing && !hasIceShield && requiresIceBarrier) {
    // Estimate ice & water shield cost (industry standard: $3-4 per SF for valleys/eaves)
    const estimatedCoverage = 200; // SF (valleys + eaves)
    const costPerSF = 3.50;
    const estimatedCost = estimatedCoverage * costPerSF;
    
    return {
      triggered: true,
      issue: 'Missing Ice & Water Shield',
      category: 'code_compliance',
      priority: 'high',
      explanation: 'Cold climate region requires ice & water shield protection in valleys and eaves. Not included in carrier estimate.',
      estimatedCostImpact: parseFloat(estimatedCost.toFixed(2)),
      calculation: {
        estimated_coverage_sf: estimatedCoverage,
        cost_per_sf: costPerSF,
        total_cost: estimatedCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Check ventilation compliance
 */
function checkVentilationCompliance(lineItems) {
  const hasRidgeVent = lineItems.some(item =>
    item.description?.toLowerCase().includes('ridge vent')
  );
  
  const hasIntakeVent = lineItems.some(item =>
    item.description?.toLowerCase().includes('soffit vent') ||
    item.description?.toLowerCase().includes('intake vent') ||
    item.description?.toLowerCase().includes('eave vent')
  );
  
  if (hasRidgeVent && !hasIntakeVent) {
    // Estimate intake vent cost
    const estimatedPerimeter = 150; // LF
    const costPerLF = 4.00;
    const estimatedCost = estimatedPerimeter * costPerLF;
    
    return {
      triggered: true,
      issue: 'Ventilation Imbalance',
      category: 'code_compliance',
      priority: 'medium',
      explanation: 'Ridge vent present but no intake ventilation detected. Building codes require balanced ventilation (intake + exhaust).',
      estimatedCostImpact: parseFloat(estimatedCost.toFixed(2)),
      calculation: {
        estimated_perimeter_lf: estimatedPerimeter,
        cost_per_lf: costPerLF,
        total_cost: estimatedCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Check insulation R-value compliance
 */
function checkInsulationRValue(lineItems, regionalData) {
  const insulationItems = lineItems.filter(item =>
    item.description?.toLowerCase().includes('insulation') ||
    item.description?.toLowerCase().includes('insul')
  );
  
  if (insulationItems.length === 0) {
    return { triggered: false };
  }
  
  // Extract R-value from description
  let detectedRValue = null;
  for (const item of insulationItems) {
    const rMatch = item.description?.match(/R-?(\d+)/i);
    if (rMatch) {
      detectedRValue = parseInt(rMatch[1]);
      break;
    }
  }
  
  // Modern code requirements (simplified)
  const requiredRValue = regionalData.climate === 'cold' ? 49 : 38;
  
  if (detectedRValue && detectedRValue < requiredRValue) {
    // Calculate upgrade cost
    const rValueGap = requiredRValue - detectedRValue;
    const estimatedSF = 1500; // Average attic SF
    const costPerRValuePerSF = 0.50; // Industry estimate
    const estimatedCost = estimatedSF * rValueGap * costPerRValuePerSF;
    
    return {
      triggered: true,
      issue: 'Insulation R-Value Below Code',
      category: 'code_compliance',
      priority: 'medium',
      explanation: `Detected R-${detectedRValue} insulation. Modern building codes require R-${requiredRValue} for this climate zone. Upgrade required.`,
      estimatedCostImpact: parseFloat(estimatedCost.toFixed(2)),
      calculation: {
        detected_r_value: detectedRValue,
        required_r_value: requiredRValue,
        r_value_gap: rValueGap,
        estimated_sf: estimatedSF,
        cost_per_r_per_sf: costPerRValuePerSF,
        total_cost: estimatedCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Check electrical code upgrades
 */
function checkElectricalCodeUpgrades(lineItems) {
  const electricalItems = lineItems.filter(item =>
    item.category === 'Electrical' ||
    item.description?.toLowerCase().includes('electric') ||
    item.description?.toLowerCase().includes('wiring')
  );
  
  if (electricalItems.length === 0) {
    return { triggered: false };
  }
  
  // Check for GFCI/AFCI requirements
  const hasGFCI = lineItems.some(item =>
    item.description?.toLowerCase().includes('gfci') ||
    item.description?.toLowerCase().includes('ground fault')
  );
  
  const hasAFCI = lineItems.some(item =>
    item.description?.toLowerCase().includes('afci') ||
    item.description?.toLowerCase().includes('arc fault')
  );
  
  // If electrical work present but no GFCI/AFCI, flag potential upgrade
  if (!hasGFCI || !hasAFCI) {
    const estimatedCost = 1200; // Average GFCI/AFCI upgrade cost
    
    return {
      triggered: true,
      issue: 'Electrical Code Upgrade Required',
      category: 'code_compliance',
      priority: 'high',
      explanation: 'Electrical work detected. Modern codes require GFCI outlets in wet areas and AFCI protection in living spaces. Carrier estimate may not include required upgrades.',
      estimatedCostImpact: estimatedCost,
      calculation: {
        gfci_present: hasGFCI,
        afci_present: hasAFCI,
        estimated_upgrade_cost: estimatedCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Check plumbing code upgrades
 */
function checkPlumbingCodeUpgrades(lineItems) {
  const plumbingItems = lineItems.filter(item =>
    item.category === 'Plumbing' ||
    item.category === 'Plumbing/HVAC' ||
    item.description?.toLowerCase().includes('plumb') ||
    item.description?.toLowerCase().includes('pipe')
  );
  
  if (plumbingItems.length === 0) {
    return { triggered: false };
  }
  
  // Check for water heater seismic strapping (required in seismic zones)
  const hasWaterHeater = lineItems.some(item =>
    item.description?.toLowerCase().includes('water heater')
  );
  
  const hasSeismicStrapping = lineItems.some(item =>
    item.description?.toLowerCase().includes('seismic') ||
    item.description?.toLowerCase().includes('strap')
  );
  
  if (hasWaterHeater && !hasSeismicStrapping) {
    const estimatedCost = 150; // Seismic strapping cost
    
    return {
      triggered: true,
      issue: 'Plumbing Code Upgrade - Seismic Strapping',
      category: 'code_compliance',
      priority: 'low',
      explanation: 'Water heater replacement detected. Seismic zones require water heater strapping. Verify if applicable to property location.',
      estimatedCostImpact: estimatedCost,
      calculation: {
        water_heater_present: hasWaterHeater,
        seismic_strapping_present: hasSeismicStrapping,
        estimated_cost: estimatedCost
      }
    };
  }
  
  return { triggered: false };
}

/**
 * Calculate total roof size from line items
 */
function calculateTotalRoofSize(lineItems) {
  let totalSQ = 0;
  
  for (const item of lineItems) {
    if (item.category === 'Roofing') {
      const unit = item.unit?.toUpperCase();
      if (unit === 'SQ') {
        totalSQ += item.quantity || 0;
      } else if (unit === 'SF') {
        totalSQ += (item.quantity || 0) / 100; // Convert SF to SQ
      }
    }
  }
  
  return totalSQ;
}

module.exports = {
  analyzeCodeUpgrades,
  checkRoof25PercentRule,
  checkDripEdge,
  checkIceAndWaterShield,
  checkVentilationCompliance,
  checkInsulationRValue,
  checkElectricalCodeUpgrades,
  checkPlumbingCodeUpgrades
};

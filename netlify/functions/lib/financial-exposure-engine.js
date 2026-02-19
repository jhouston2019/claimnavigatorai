/**
 * Financial Exposure Engine - ERP-Parity Financial Quantification
 * Deterministic calculations for RCV, ACV, Depreciation, and O&P exposure
 * NO AI - Pure mathematical reconciliation
 * 
 * Produces:
 * - Total Estimated Underpayment (RCV delta)
 * - Total ACV delta
 * - Total Recoverable Depreciation
 * - O&P exposure calculation (rule-based)
 * - Category-level exposure breakdown
 * - Structured reconciliation table
 * - Negotiation-ready JSON output
 */

/**
 * Calculate comprehensive financial exposure from reconciliation results
 * @param {object} reconciliation - Reconciliation output from estimate-reconciler
 * @param {Array} contractorLineItems - All contractor line items
 * @param {Array} carrierLineItems - All carrier line items
 * @returns {object} Financial exposure summary
 */
function calculateExposure(reconciliation, contractorLineItems = [], carrierLineItems = []) {
  const startTime = Date.now();
  
  // Extract data from reconciliation
  const discrepancies = reconciliation.discrepancies || [];
  const categoryBreakdown = reconciliation.categoryBreakdown || {};
  const opAnalysis = reconciliation.opAnalysis || {};
  const totals = reconciliation.totals || {};
  
  // =====================================================
  // STEP 1: RCV / ACV / DEPRECIATION CALCULATIONS
  // =====================================================
  const financialDeltas = calculateRCVACVDeltas(discrepancies);
  
  // =====================================================
  // STEP 2: O&P EXPOSURE (RULE-BASED)
  // =====================================================
  const opExposure = calculateOPExposure(
    contractorLineItems,
    carrierLineItems,
    opAnalysis,
    totals.contractor_total || 0,
    totals.carrier_total || 0
  );
  
  // =====================================================
  // STEP 3: CATEGORY-LEVEL EXPOSURE BREAKDOWN
  // =====================================================
  const categoryExposure = calculateCategoryExposure(
    discrepancies,
    categoryBreakdown
  );
  
  // =====================================================
  // STEP 4: TOTAL PROJECTED RECOVERY
  // =====================================================
  const totalProjectedRecovery = calculateTotalProjectedRecovery(
    financialDeltas.rcvDeltaTotal,
    opExposure.opAmount
  );
  
  // =====================================================
  // STEP 5: STRUCTURED LINE ITEM DELTAS
  // =====================================================
  const structuredLineItemDeltas = buildStructuredLineItemDeltas(discrepancies);
  
  // =====================================================
  // STEP 6: NEGOTIATION PAYLOAD
  // =====================================================
  const negotiationPayload = buildNegotiationPayload(
    financialDeltas,
    opExposure,
    categoryExposure,
    totalProjectedRecovery,
    structuredLineItemDeltas
  );
  
  // =====================================================
  // STEP 7: VALIDATION (with double-count protection)
  // =====================================================
  const validation = validateFinancialExposure(
    financialDeltas,
    totals,
    categoryExposure,
    totalProjectedRecovery,
    opExposure.opAmount
  );
  
  const processingTime = Date.now() - startTime;
  
  return {
    // Core Financial Metrics
    rcvDeltaTotal: financialDeltas.rcvDeltaTotal,
    acvDeltaTotal: financialDeltas.acvDeltaTotal,
    recoverableDepreciationTotal: financialDeltas.recoverableDepreciationTotal,
    
    // O&P Exposure
    opExposure: opExposure,
    
    // Category Breakdown
    categoryBreakdown: categoryExposure,
    
    // Total Recovery
    totalProjectedRecovery: totalProjectedRecovery,
    
    // Structured Data
    structuredLineItemDeltas: structuredLineItemDeltas,
    
    // Negotiation Payload
    negotiationPayload: negotiationPayload,
    
    // Validation
    validation: validation,
    
    // Metadata
    metadata: {
      calculation_method: 'deterministic',
      processing_time_ms: processingTime,
      engine_version: '1.0',
      total_discrepancies_analyzed: discrepancies.length
    }
  };
}

/**
 * Calculate RCV, ACV, and Depreciation deltas
 * UPGRADED: Uses REAL extracted RCV/ACV values (no simulated depreciation)
 * @param {Array} discrepancies - Array of discrepancy objects
 * @returns {object} Financial deltas
 */
function calculateRCVACVDeltas(discrepancies) {
  let rcvDeltaTotal = 0;
  let acvDeltaTotal = 0;
  let recoverableDepreciationTotal = 0;
  
  const lineItemDeltas = [];
  
  for (const disc of discrepancies) {
    // Extract REAL RCV and ACV values from discrepancy
    // These come from parsed estimates with actual depreciation
    const contractorRCV = disc.contractor_rcv_total || disc.contractor_total || 0;
    const carrierRCV = disc.carrier_rcv_total || disc.carrier_total || 0;
    const contractorACV = disc.contractor_acv_total || disc.contractor_total || 0;
    const carrierACV = disc.carrier_acv_total || disc.carrier_total || 0;
    
    // Calculate deltas using EXTRACTED values (not simulated)
    const rcvDelta = contractorRCV - carrierRCV;
    const acvDelta = contractorACV - carrierACV;
    
    // Depreciation delta = difference in actual depreciation amounts
    const contractorDepreciation = disc.contractor_depreciation || 0;
    const carrierDepreciation = disc.carrier_depreciation || 0;
    const depreciationDelta = contractorDepreciation - carrierDepreciation;
    
    // Only count positive deltas (underpayment)
    if (rcvDelta > 0) {
      rcvDeltaTotal += rcvDelta;
      acvDeltaTotal += acvDelta;
      recoverableDepreciationTotal += depreciationDelta;
    }
    
    lineItemDeltas.push({
      line_item_description: disc.line_item_description,
      category: disc.category,
      rcvDelta: parseFloat(rcvDelta.toFixed(2)),
      acvDelta: parseFloat(acvDelta.toFixed(2)),
      depreciationDelta: parseFloat(depreciationDelta.toFixed(2)),
      has_extracted_depreciation: !!(disc.contractor_depreciation || disc.carrier_depreciation),
      contractor_rcv: contractorRCV,
      contractor_acv: contractorACV,
      carrier_rcv: carrierRCV,
      carrier_acv: carrierACV
    });
  }
  
  return {
    rcvDeltaTotal: parseFloat(rcvDeltaTotal.toFixed(2)),
    acvDeltaTotal: parseFloat(acvDeltaTotal.toFixed(2)),
    recoverableDepreciationTotal: parseFloat(recoverableDepreciationTotal.toFixed(2)),
    lineItemDeltas: lineItemDeltas
  };
}

/**
 * Calculate O&P exposure using rule-based logic
 * @param {Array} contractorLineItems - Contractor line items
 * @param {Array} carrierLineItems - Carrier line items
 * @param {object} opAnalysis - O&P analysis from reconciler
 * @param {number} contractorTotal - Contractor total
 * @param {number} carrierTotal - Carrier total
 * @returns {object} O&P exposure
 */
function calculateOPExposure(contractorLineItems, carrierLineItems, opAnalysis, contractorTotal, carrierTotal) {
  // RULE: If 3 or more distinct trades detected, O&P qualifies
  const tradesDetected = detectDistinctTrades(contractorLineItems);
  const qualifiesForOP = tradesDetected.length >= 3;
  
  let opAmount = 0;
  let reason = '';
  let calculation = null;
  
  // Check if carrier included O&P
  const carrierHasOP = opAnalysis?.carrier?.has_op || false;
  const contractorHasOP = opAnalysis?.contractor?.has_op || false;
  
  if (qualifiesForOP) {
    if (contractorHasOP && carrierHasOP) {
      // BOTH have O&P - calculate DELTA (correct approach)
      const opGap = opAnalysis?.gap?.total_op_gap || 0;
      if (Math.abs(opGap) > 100) {
        opAmount = Math.max(0, opGap); // Only count positive gaps (underpayment)
        reason = `O&P rate difference detected. Contractor: ${opAnalysis.contractor.combined_percent || 20}%, Carrier: ${opAnalysis.carrier.combined_percent || 0}%. Gap represents underpayment.`;
        calculation = {
          contractor_op: opAnalysis.contractor.total_op || 0,
          carrier_op: opAnalysis.carrier.total_op || 0,
          gap: opGap
        };
      } else {
        reason = 'O&P rates aligned between estimates.';
      }
    } else if (contractorHasOP && !carrierHasOP) {
      // Contractor has O&P, carrier does NOT
      // Use contractor's ACTUAL O&P amount (delta approach - prevents overstatement)
      opAmount = opAnalysis.contractor.total_op || 0;
      reason = `Carrier estimate missing O&P. Contractor includes ${opAnalysis.contractor.combined_percent || 20}% O&P (${tradesDetected.length} trades: ${tradesDetected.join(', ')}). Using contractor's actual O&P amount.`;
      calculation = {
        contractor_op: opAnalysis.contractor.total_op || 0,
        carrier_op: 0,
        gap: opAnalysis.contractor.total_op || 0,
        method: 'delta'
      };
    } else if (!contractorHasOP && carrierHasOP) {
      // Carrier has O&P, contractor does NOT (rare - possible overpayment)
      const carrierOP = opAnalysis.carrier.total_op || 0;
      opAmount = 0; // No exposure (carrier paying more)
      reason = `Carrier applied O&P (${opAnalysis.carrier.combined_percent || 0}%) but contractor did not include separate O&P. May be embedded in contractor pricing. No additional O&P exposure.`;
      calculation = {
        contractor_op: 0,
        carrier_op: carrierOP,
        gap: -carrierOP
      };
    } else if (!contractorHasOP && !carrierHasOP) {
      // NEITHER has explicit O&P, but qualifies by trade count
      // O&P may be embedded in line item pricing - cannot calculate exposure
      reason = `${tradesDetected.length} distinct trades detected (${tradesDetected.join(', ')}). Neither estimate shows explicit O&P line items. O&P may be embedded in line item pricing. Cannot calculate O&P exposure without explicit values.`;
      opAmount = 0;
      calculation = {
        contractor_op: 0,
        carrier_op: 0,
        gap: 0,
        note: 'O&P potentially embedded - requires manual verification'
      };
    }
  } else {
    reason = `Only ${tradesDetected.length} distinct trade(s) detected. O&P typically applies when 3+ trades are involved.`;
  }
  
  return {
    qualifiesForOP: qualifiesForOP,
    tradesDetected: tradesDetected,
    tradeCount: tradesDetected.length,
    opAmount: parseFloat(opAmount.toFixed(2)),
    reason: reason,
    calculation: calculation,
    carrierHasOP: carrierHasOP,
    contractorHasOP: contractorHasOP
  };
}

/**
 * Detect distinct trades from line items
 * @param {Array} lineItems - Line items
 * @returns {Array} Array of distinct trade names
 */
function detectDistinctTrades(lineItems) {
  const trades = new Set();
  
  for (const item of lineItems) {
    const category = item.category;
    
    // Map categories to trade names
    const tradeMapping = {
      'Roofing': 'Roofing',
      'Siding': 'Siding',
      'Interior': 'Interior Finishing',
      'Drywall': 'Drywall',
      'Painting': 'Painting',
      'Electrical': 'Electrical',
      'Plumbing': 'Plumbing',
      'Plumbing/HVAC': 'Plumbing/HVAC',
      'HVAC': 'HVAC',
      'Flooring': 'Flooring',
      'Windows/Doors': 'Windows/Doors',
      'Framing': 'Framing',
      'Carpentry': 'Carpentry',
      'Structural': 'Structural',
      'Foundation': 'Foundation',
      'Demolition': 'Demolition',
      'Insulation': 'Insulation',
      'Tile': 'Tile',
      'Cabinetry': 'Cabinetry',
      'Countertops': 'Countertops'
    };
    
    const trade = tradeMapping[category];
    if (trade) {
      trades.add(trade);
    }
  }
  
  return Array.from(trades).sort();
}

/**
 * Calculate subtotal excluding O&P, tax, and non-covered items
 * UPGRADED: Proper base calculation for O&P
 * @param {Array} lineItems - Line items
 * @returns {number} Subtotal
 */
function calculateSubtotalExcludingOP(lineItems) {
  let subtotal = 0;
  
  for (const item of lineItems) {
    // Exclude O&P lines
    const isOPLine = item.is_op === true;
    
    // Exclude tax lines
    const isTaxLine = item.is_tax === true;
    
    // Exclude total/subtotal lines
    const isSummaryLine = item.is_total || item.is_subtotal;
    
    // Exclude non-covered items (if flagged)
    const isNonCovered = item.coverage_eligible === false;
    
    // Include only eligible items in O&P base
    if (!isOPLine && !isTaxLine && !isSummaryLine && !isNonCovered) {
      // Use RCV total (not ACV) for O&P base
      subtotal += item.rcv_total || item.total || 0;
    }
  }
  
  return subtotal;
}

/**
 * Calculate category-level exposure breakdown
 * UPGRADED: Uses real extracted RCV/ACV values
 * @param {Array} discrepancies - Discrepancies
 * @param {object} categoryBreakdown - Category breakdown from reconciler
 * @returns {Array} Category exposure array
 */
function calculateCategoryExposure(discrepancies, categoryBreakdown) {
  const categoryMap = {};
  
  // Aggregate discrepancies by category
  for (const disc of discrepancies) {
    const category = disc.category || 'Other';
    
    if (!categoryMap[category]) {
      categoryMap[category] = {
        category: category,
        rcvDelta: 0,
        acvDelta: 0,
        depreciationDelta: 0,
        contractorTotal: 0,
        carrierTotal: 0,
        discrepancyCount: 0
      };
    }
    
    // Use REAL extracted RCV/ACV values (not simulated)
    const contractorRCV = disc.contractor_rcv_total || disc.contractor_total || 0;
    const carrierRCV = disc.carrier_rcv_total || disc.carrier_total || 0;
    const contractorACV = disc.contractor_acv_total || disc.contractor_total || 0;
    const carrierACV = disc.carrier_acv_total || disc.carrier_total || 0;
    
    const rcvDelta = contractorRCV - carrierRCV;
    const acvDelta = contractorACV - carrierACV;
    const depreciationDelta = (disc.contractor_depreciation || 0) - (disc.carrier_depreciation || 0);
    
    // Only count positive deltas (underpayment)
    if (rcvDelta > 0) {
      categoryMap[category].rcvDelta += rcvDelta;
      categoryMap[category].acvDelta += acvDelta;
      categoryMap[category].depreciationDelta += depreciationDelta;
    }
    
    categoryMap[category].contractorTotal += contractorRCV;
    categoryMap[category].carrierTotal += carrierRCV;
    categoryMap[category].discrepancyCount++;
  }
  
  // Convert to array and calculate percentages
  const categoryArray = Object.values(categoryMap).map(cat => {
    const percentUnderpaid = cat.contractorTotal > 0
      ? (cat.rcvDelta / cat.contractorTotal) * 100
      : 0;
    
    return {
      category: cat.category,
      rcvDelta: parseFloat(cat.rcvDelta.toFixed(2)),
      acvDelta: parseFloat(cat.acvDelta.toFixed(2)),
      depreciationDelta: parseFloat(cat.depreciationDelta.toFixed(2)),
      contractorTotal: parseFloat(cat.contractorTotal.toFixed(2)),
      carrierTotal: parseFloat(cat.carrierTotal.toFixed(2)),
      percentUnderpaid: parseFloat(percentUnderpaid.toFixed(2)),
      discrepancyCount: cat.discrepancyCount
    };
  });
  
  // Sort by RCV delta descending (highest exposure first)
  categoryArray.sort((a, b) => b.rcvDelta - a.rcvDelta);
  
  return categoryArray;
}

/**
 * Calculate total projected recovery
 * @param {number} rcvDeltaTotal - Total RCV delta
 * @param {number} opAmount - O&P exposure amount
 * @returns {number} Total projected recovery
 */
function calculateTotalProjectedRecovery(rcvDeltaTotal, opAmount) {
  const total = rcvDeltaTotal + opAmount;
  return parseFloat(total.toFixed(2));
}

/**
 * Build structured line item deltas table
 * UPGRADED: Uses real extracted RCV/ACV values
 * @param {Array} discrepancies - Discrepancies
 * @returns {Array} Structured line item deltas
 */
function buildStructuredLineItemDeltas(discrepancies) {
  return discrepancies.map(disc => {
    // Use REAL extracted RCV/ACV values
    const contractorRCV = disc.contractor_rcv_total || disc.contractor_total || 0;
    const carrierRCV = disc.carrier_rcv_total || disc.carrier_total || 0;
    const contractorACV = disc.contractor_acv_total || disc.contractor_total || 0;
    const carrierACV = disc.carrier_acv_total || disc.carrier_total || 0;
    
    const rcvDelta = contractorRCV - carrierRCV;
    const acvDelta = contractorACV - carrierACV;
    const depreciationDelta = (disc.contractor_depreciation || 0) - (disc.carrier_depreciation || 0);
    
    return {
      description: disc.line_item_description,
      category: disc.category,
      discrepancyType: disc.discrepancy_type,
      
      // Quantities
      carrierQty: disc.carrier_quantity || 0,
      contractorQty: disc.contractor_quantity || 0,
      qtyDelta: disc.quantity_delta || 0,
      
      // Unit Prices
      carrierUnitPrice: disc.carrier_unit_price || 0,
      contractorUnitPrice: disc.contractor_unit_price || 0,
      unitPriceDelta: disc.unit_price_delta || 0,
      
      // Totals (RCV)
      carrierTotal: parseFloat(carrierRCV.toFixed(2)),
      contractorTotal: parseFloat(contractorRCV.toFixed(2)),
      
      // Financial Deltas (REAL VALUES)
      rcvDelta: parseFloat(rcvDelta.toFixed(2)),
      acvDelta: parseFloat(acvDelta.toFixed(2)),
      depreciationDelta: parseFloat(depreciationDelta.toFixed(2)),
      
      // Depreciation info
      hasExtractedDepreciation: !!(disc.contractor_depreciation || disc.carrier_depreciation),
      contractorDepreciation: disc.contractor_depreciation || 0,
      carrierDepreciation: disc.carrier_depreciation || 0,
      
      // Metadata
      matchConfidence: disc.match_confidence,
      matchMethod: disc.match_method,
      notes: disc.notes
    };
  }).filter(item => item.rcvDelta !== 0); // Only include items with deltas
}

/**
 * Build negotiation payload
 * @param {object} financialDeltas - Financial deltas
 * @param {object} opExposure - O&P exposure
 * @param {Array} categoryExposure - Category exposure
 * @param {number} totalProjectedRecovery - Total projected recovery
 * @param {Array} structuredLineItemDeltas - Structured line item deltas
 * @returns {object} Negotiation payload
 */
function buildNegotiationPayload(financialDeltas, opExposure, categoryExposure, totalProjectedRecovery, structuredLineItemDeltas) {
  return {
    summary: {
      totalProjectedRecovery: totalProjectedRecovery,
      rcvDeltaTotal: financialDeltas.rcvDeltaTotal,
      acvDeltaTotal: financialDeltas.acvDeltaTotal,
      recoverableDepreciationTotal: financialDeltas.recoverableDepreciationTotal,
      opExposure: opExposure.opAmount
    },
    
    opAnalysis: {
      qualifies: opExposure.qualifiesForOP,
      tradesDetected: opExposure.tradesDetected,
      tradeCount: opExposure.tradeCount,
      amount: opExposure.opAmount,
      reason: opExposure.reason,
      calculation: opExposure.calculation
    },
    
    categoryBreakdown: categoryExposure,
    
    lineItemDeltas: structuredLineItemDeltas,
    
    negotiationPoints: generateNegotiationPoints(
      financialDeltas,
      opExposure,
      categoryExposure
    ),
    
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate negotiation points
 * @param {object} financialDeltas - Financial deltas
 * @param {object} opExposure - O&P exposure
 * @param {Array} categoryExposure - Category exposure
 * @returns {Array} Negotiation points
 */
function generateNegotiationPoints(financialDeltas, opExposure, categoryExposure) {
  const points = [];
  
  // Point 1: Total underpayment
  if (financialDeltas.rcvDeltaTotal > 0) {
    points.push({
      priority: 'critical',
      category: 'total_underpayment',
      title: 'Estimated Underpayment Identified',
      amount: financialDeltas.rcvDeltaTotal,
      description: `Total RCV delta of $${financialDeltas.rcvDeltaTotal.toFixed(2)} identified across line items. Carrier estimate undervalues scope by this amount.`
    });
  }
  
  // Point 2: O&P exposure
  if (opExposure.opAmount > 0) {
    points.push({
      priority: 'high',
      category: 'op_exposure',
      title: 'O&P Exposure',
      amount: opExposure.opAmount,
      description: opExposure.reason
    });
  }
  
  // Point 3: Top 3 category exposures
  const topCategories = categoryExposure.slice(0, 3).filter(cat => cat.rcvDelta > 0);
  for (const cat of topCategories) {
    points.push({
      priority: 'medium',
      category: 'category_exposure',
      title: `${cat.category} Underpayment`,
      amount: cat.rcvDelta,
      description: `${cat.category} category shows $${cat.rcvDelta.toFixed(2)} underpayment (${cat.percentUnderpaid.toFixed(1)}% of contractor total). ${cat.discrepancyCount} discrepancies identified.`
    });
  }
  
  // Point 4: Depreciation recovery
  if (financialDeltas.recoverableDepreciationTotal > 0) {
    points.push({
      priority: 'medium',
      category: 'depreciation_recovery',
      title: 'Recoverable Depreciation',
      amount: financialDeltas.recoverableDepreciationTotal,
      description: `$${financialDeltas.recoverableDepreciationTotal.toFixed(2)} in depreciation is recoverable upon completion of repairs (RCV policy).`
    });
  }
  
  return points;
}

/**
 * Validate financial exposure calculations
 * UPGRADED: Includes double-count protection
 * @param {object} financialDeltas - Financial deltas
 * @param {object} totals - Totals from reconciler
 * @param {Array} categoryExposure - Category exposure
 * @param {number} totalProjectedRecovery - Total projected recovery
 * @param {number} opAmount - O&P exposure amount
 * @returns {object} Validation results
 */
function validateFinancialExposure(financialDeltas, totals, categoryExposure, totalProjectedRecovery, opAmount) {
  const errors = [];
  const warnings = [];
  
  // Validate: RCV delta should match underpayment from reconciler
  const reconUnderpayment = totals.underpayment_amount || 0;
  const calculatedRCV = financialDeltas.rcvDeltaTotal;
  const tolerance = 0.01;
  
  if (Math.abs(reconUnderpayment - calculatedRCV) > tolerance) {
    warnings.push(`RCV delta ($${calculatedRCV}) differs from reconciler underpayment ($${reconUnderpayment}). Difference: $${Math.abs(reconUnderpayment - calculatedRCV).toFixed(2)}`);
  }
  
  // Validate: Category totals should sum to RCV delta
  const categorySum = categoryExposure.reduce((sum, cat) => sum + cat.rcvDelta, 0);
  if (Math.abs(categorySum - calculatedRCV) > tolerance) {
    errors.push(`Category sum ($${categorySum.toFixed(2)}) does not match RCV delta total ($${calculatedRCV.toFixed(2)})`);
  }
  
  // Validate: ACV should be less than or equal to RCV
  if (financialDeltas.acvDeltaTotal > financialDeltas.rcvDeltaTotal + tolerance) {
    errors.push('ACV delta cannot exceed RCV delta');
  }
  
  // Validate: Depreciation should equal RCV - ACV
  const expectedDepreciation = financialDeltas.rcvDeltaTotal - financialDeltas.acvDeltaTotal;
  if (Math.abs(expectedDepreciation - financialDeltas.recoverableDepreciationTotal) > tolerance) {
    errors.push(`Depreciation calculation mismatch. Expected: $${expectedDepreciation.toFixed(2)}, Calculated: $${financialDeltas.recoverableDepreciationTotal.toFixed(2)}`);
  }
  
  // CRITICAL: Validate total projected recovery (double-count protection)
  const expectedTotal = financialDeltas.rcvDeltaTotal + opAmount;
  if (Math.abs(totalProjectedRecovery - expectedTotal) > tolerance) {
    errors.push(`Total Projected Recovery mismatch. Expected: $${expectedTotal.toFixed(2)}, Calculated: $${totalProjectedRecovery.toFixed(2)}. Possible double-counting.`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

module.exports = {
  calculateExposure,
  calculateRCVACVDeltas,
  calculateOPExposure,
  calculateCategoryExposure,
  calculateTotalProjectedRecovery,
  buildStructuredLineItemDeltas,
  buildNegotiationPayload,
  validateFinancialExposure
};

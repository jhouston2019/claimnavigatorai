/**
 * Estimate Reconciler - Deterministic Financial Reconciliation Engine
 * All math is computed in code, not by AI
 * NOW WITH: Unit normalization, O&P detection, Category aggregation
 */

const { calculateNormalizedDelta } = require('./unit-normalizer');
const { detectOP, calculateOPGap } = require('./op-detector');

/**
 * Reconcile matched line items and calculate discrepancies
 * @param {Array} matches - Matched line items from matcher
 * @param {Array} unmatchedContractor - Unmatched contractor items
 * @param {Array} unmatchedCarrier - Unmatched carrier items
 * @param {Array} allContractorItems - All contractor items (for O&P detection)
 * @param {Array} allCarrierItems - All carrier items (for O&P detection)
 * @returns {object} Reconciliation results with deterministic calculations
 */
function reconcileEstimates(matches, unmatchedContractor, unmatchedCarrier, allContractorItems = [], allCarrierItems = []) {
  const discrepancies = [];
  const unitConversionWarnings = [];
  
  // Process matched items WITH UNIT NORMALIZATION
  for (const match of matches) {
    const contractor = match.contractor;
    const carrier = match.carrier;
    
    // Calculate discrepancies with unit normalization
    const discrepancy = calculateDiscrepancyWithNormalization(contractor, carrier, match);
    
    if (discrepancy) {
      discrepancies.push({
        ...discrepancy,
        match_confidence: match.match_confidence,
        match_method: match.match_method
      });
      
      // Track unit conversion warnings
      if (discrepancy.unit_conversion_applied) {
        unitConversionWarnings.push({
          line: contractor.description,
          from_unit: discrepancy.carrier_unit_original,
          to_unit: discrepancy.contractor_unit_original,
          conversion_factor: discrepancy.conversion_factor
        });
      }
    }
  }
  
  // Process unmatched contractor items (missing from carrier)
  for (const item of unmatchedContractor) {
    discrepancies.push({
      discrepancy_type: 'missing_item',
      line_item_description: item.description,
      category: item.category,
      contractor_line_id: item.id,
      carrier_line_id: null,
      contractor_quantity: item.quantity,
      carrier_quantity: 0,
      contractor_unit_price: item.unit_price,
      carrier_unit_price: 0,
      contractor_total: item.total,
      carrier_total: 0,
      difference_amount: item.total,
      quantity_delta: item.quantity,
      unit_price_delta: item.unit_price,
      percentage_difference: 100.00,
      notes: `Item present in contractor estimate but missing from carrier estimate`,
      match_confidence: null,
      match_method: null
    });
  }
  
  // Process unmatched carrier items (extra in carrier)
  for (const item of unmatchedCarrier) {
    discrepancies.push({
      discrepancy_type: 'extra_item',
      line_item_description: item.description,
      category: item.category,
      contractor_line_id: null,
      carrier_line_id: item.id,
      contractor_quantity: 0,
      carrier_quantity: item.quantity,
      contractor_unit_price: 0,
      carrier_unit_price: item.unit_price,
      contractor_total: 0,
      carrier_total: item.total,
      difference_amount: -item.total,
      quantity_delta: -item.quantity,
      unit_price_delta: -item.unit_price,
      percentage_difference: -100.00,
      notes: `Item present in carrier estimate but missing from contractor estimate`,
      match_confidence: null,
      match_method: null
    });
  }
  
  // Calculate totals deterministically
  const totals = calculateTotals(discrepancies);
  
  // Calculate category breakdown WITH AGGREGATION
  const categoryBreakdown = calculateCategoryBreakdown(discrepancies);
  
  // Detect O&P in both estimates
  const contractorOP = detectOP(allContractorItems);
  const carrierOP = detectOP(allCarrierItems);
  
  // Calculate O&P gap
  const opGap = calculateOPGap(
    contractorOP,
    carrierOP,
    totals.contractor_total,
    totals.carrier_total
  );
  
  return {
    discrepancies,
    totals,
    categoryBreakdown,
    opAnalysis: opGap,
    unitConversionWarnings,
    stats: {
      total_discrepancies: discrepancies.length,
      missing_items: discrepancies.filter(d => d.discrepancy_type === 'missing_item').length,
      extra_items: discrepancies.filter(d => d.discrepancy_type === 'extra_item').length,
      quantity_differences: discrepancies.filter(d => d.discrepancy_type === 'quantity_difference').length,
      pricing_differences: discrepancies.filter(d => d.discrepancy_type === 'pricing_difference').length,
      scope_differences: discrepancies.filter(d => d.discrepancy_type === 'scope_omission').length,
      unit_conversions_applied: unitConversionWarnings.length
    }
  };
}

/**
 * Calculate discrepancy for a matched pair WITH UNIT NORMALIZATION
 */
function calculateDiscrepancyWithNormalization(contractor, carrier, match) {
  // Use unit normalizer for accurate comparison
  const normalized = calculateNormalizedDelta(contractor, carrier);
  
  // If units are incompatible, flag as error
  if (!normalized.compatible) {
    return {
      discrepancy_type: 'unit_incompatible',
      line_item_description: contractor.description,
      category: contractor.category,
      contractor_line_id: contractor.id,
      carrier_line_id: carrier.id,
      contractor_quantity: contractor.quantity,
      carrier_quantity: carrier.quantity,
      contractor_unit: contractor.unit,
      carrier_unit: carrier.unit,
      contractor_unit_price: contractor.unit_price,
      carrier_unit_price: carrier.unit_price,
      contractor_total: contractor.total,
      carrier_total: carrier.total,
      difference_amount: contractor.total - carrier.total,
      quantity_delta: 0,
      unit_price_delta: 0,
      percentage_difference: 0,
      notes: `UNIT INCOMPATIBILITY: Cannot compare ${contractor.unit} with ${carrier.unit}`,
      error: normalized.error
    };
  }
  
  const difference = normalized.total_delta;
  
  // Skip if totals match (within $0.01 tolerance)
  if (Math.abs(difference) < 0.01) {
    return null;
  }
  
  // Determine discrepancy type
  const discrepancyType = determineDiscrepancyType(
    { ...contractor, quantity: normalized.contractor_quantity, unit_price: normalized.contractor_unit_price },
    { ...carrier, quantity: normalized.carrier_quantity, unit_price: normalized.carrier_unit_price }
  );
  
  return {
    discrepancy_type: discrepancyType,
    line_item_description: contractor.description,
    category: contractor.category,
    contractor_line_id: contractor.id,
    carrier_line_id: carrier.id,
    
    // Original values
    contractor_unit_original: normalized.contractor_unit_original,
    carrier_unit_original: normalized.carrier_unit_original,
    contractor_quantity_original: normalized.contractor_quantity_original,
    carrier_quantity_original: normalized.carrier_quantity_original,
    
    // Normalized values (for accurate comparison)
    contractor_quantity: normalized.contractor_quantity,
    carrier_quantity: normalized.carrier_quantity,
    contractor_unit: normalized.standard_unit,
    carrier_unit: normalized.standard_unit,
    contractor_unit_price: normalized.contractor_unit_price,
    carrier_unit_price: normalized.carrier_unit_price,
    contractor_total: normalized.contractor_total,
    carrier_total: normalized.carrier_total,
    
    // Deltas (using normalized values)
    difference_amount: normalized.total_delta,
    quantity_delta: normalized.quantity_delta,
    unit_price_delta: normalized.unit_price_delta,
    percentage_difference: normalized.total_diff_percent,
    
    // Unit conversion tracking
    unit_conversion_applied: normalized.unit_conversion_applied,
    conversion_factor: normalized.conversion_factor,
    
    notes: generateDiscrepancyNotesWithUnits(contractor, carrier, discrepancyType, normalized)
  };
}

/**
 * Calculate discrepancy for a matched pair (LEGACY - kept for compatibility)
 */
function calculateDiscrepancy(contractor, carrier, match) {
  const contractorTotal = parseFloat(contractor.total) || 0;
  const carrierTotal = parseFloat(carrier.total) || 0;
  const difference = contractorTotal - carrierTotal;
  
  // Skip if totals match (within $0.01 tolerance)
  if (Math.abs(difference) < 0.01) {
    return null;
  }
  
  // Determine discrepancy type
  const discrepancyType = determineDiscrepancyType(contractor, carrier);
  
  // Calculate deltas
  const quantityDelta = (parseFloat(contractor.quantity) || 0) - (parseFloat(carrier.quantity) || 0);
  const unitPriceDelta = (parseFloat(contractor.unit_price) || 0) - (parseFloat(carrier.unit_price) || 0);
  
  // Calculate percentage difference
  const percentageDiff = carrierTotal !== 0 
    ? ((difference / carrierTotal) * 100).toFixed(2)
    : 100.00;
  
  return {
    discrepancy_type: discrepancyType,
    line_item_description: contractor.description,
    category: contractor.category,
    contractor_line_id: contractor.id,
    carrier_line_id: carrier.id,
    contractor_quantity: contractor.quantity,
    carrier_quantity: carrier.quantity,
    contractor_unit_price: contractor.unit_price,
    carrier_unit_price: carrier.unit_price,
    contractor_total: contractorTotal,
    carrier_total: carrierTotal,
    difference_amount: parseFloat(difference.toFixed(2)),
    quantity_delta: parseFloat(quantityDelta.toFixed(2)),
    unit_price_delta: parseFloat(unitPriceDelta.toFixed(2)),
    percentage_difference: parseFloat(percentageDiff),
    notes: generateDiscrepancyNotes(contractor, carrier, discrepancyType)
  };
}

/**
 * Determine type of discrepancy
 */
function determineDiscrepancyType(contractor, carrier) {
  const qtyDiff = Math.abs((contractor.quantity || 0) - (carrier.quantity || 0));
  const priceDiff = Math.abs((contractor.unit_price || 0) - (carrier.unit_price || 0));
  
  // Quantity difference (price same or similar)
  if (qtyDiff > 0.01 && priceDiff < 0.50) {
    return 'quantity_difference';
  }
  
  // Pricing difference (quantity same or similar)
  if (priceDiff > 0.50 && qtyDiff < 0.01) {
    return 'pricing_difference';
  }
  
  // Both quantity and price differ
  if (qtyDiff > 0.01 && priceDiff > 0.50) {
    return 'scope_omission';
  }
  
  // Material difference (descriptions differ significantly)
  if (contractor.description_normalized !== carrier.description_normalized) {
    return 'material_difference';
  }
  
  return 'other';
}

/**
 * Generate human-readable notes for discrepancy WITH UNIT CONVERSION INFO
 */
function generateDiscrepancyNotesWithUnits(contractor, carrier, type, normalized) {
  let baseNote = '';
  
  switch (type) {
    case 'quantity_difference':
      baseNote = `Quantity mismatch: Contractor has ${normalized.contractor_quantity} ${normalized.standard_unit}, Carrier has ${normalized.carrier_quantity} ${normalized.standard_unit}`;
      break;
    
    case 'pricing_difference':
      baseNote = `Unit price mismatch: Contractor $${normalized.contractor_unit_price.toFixed(2)}/${normalized.standard_unit}, Carrier $${normalized.carrier_unit_price.toFixed(2)}/${normalized.standard_unit}`;
      break;
    
    case 'scope_omission':
      baseNote = `Both quantity and pricing differ significantly`;
      break;
    
    case 'material_difference':
      baseNote = `Material or specification difference: "${contractor.description}" vs "${carrier.description}"`;
      break;
    
    default:
      baseNote = `Discrepancy detected between contractor and carrier estimates`;
  }
  
  // Add unit conversion note if applicable
  if (normalized.unit_conversion_applied) {
    baseNote += ` [Unit conversion applied: ${normalized.carrier_unit_original} → ${normalized.contractor_unit_original}, factor: ${normalized.conversion_factor}]`;
  }
  
  return baseNote;
}

/**
 * Generate human-readable notes for discrepancy (LEGACY)
 */
function generateDiscrepancyNotes(contractor, carrier, type) {
  switch (type) {
    case 'quantity_difference':
      return `Quantity mismatch: Contractor has ${contractor.quantity} ${contractor.unit}, Carrier has ${carrier.quantity} ${carrier.unit}`;
    
    case 'pricing_difference':
      return `Unit price mismatch: Contractor $${contractor.unit_price}/${contractor.unit}, Carrier $${carrier.unit_price}/${carrier.unit}`;
    
    case 'scope_omission':
      return `Both quantity and pricing differ significantly`;
    
    case 'material_difference':
      return `Material or specification difference: "${contractor.description}" vs "${carrier.description}"`;
    
    default:
      return `Discrepancy detected between contractor and carrier estimates`;
  }
}

/**
 * Calculate totals deterministically
 */
function calculateTotals(discrepancies) {
  let contractorTotal = 0;
  let carrierTotal = 0;
  let totalDiscrepancyAmount = 0;
  let underpaymentAmount = 0;
  let overpaymentAmount = 0;
  
  for (const disc of discrepancies) {
    contractorTotal += parseFloat(disc.contractor_total) || 0;
    carrierTotal += parseFloat(disc.carrier_total) || 0;
    totalDiscrepancyAmount += Math.abs(parseFloat(disc.difference_amount) || 0);
    
    const diff = parseFloat(disc.difference_amount) || 0;
    if (diff > 0) {
      underpaymentAmount += diff;
    } else if (diff < 0) {
      overpaymentAmount += Math.abs(diff);
    }
  }
  
  return {
    contractor_total: parseFloat(contractorTotal.toFixed(2)),
    carrier_total: parseFloat(carrierTotal.toFixed(2)),
    total_discrepancy_amount: parseFloat(totalDiscrepancyAmount.toFixed(2)),
    underpayment_amount: parseFloat(underpaymentAmount.toFixed(2)),
    overpayment_amount: parseFloat(overpaymentAmount.toFixed(2)),
    net_difference: parseFloat((contractorTotal - carrierTotal).toFixed(2))
  };
}

/**
 * Calculate category breakdown WITH UNDERPAYMENT AGGREGATION
 */
function calculateCategoryBreakdown(discrepancies) {
  const breakdown = {};
  
  for (const disc of discrepancies) {
    const category = disc.category || 'Other';
    
    if (!breakdown[category]) {
      breakdown[category] = {
        contractor_total: 0,
        carrier_total: 0,
        difference: 0,
        underpayment: 0,        // NEW: Track underpayment separately
        overpayment: 0,         // NEW: Track overpayment separately
        count: 0,
        missing_items: 0,       // NEW: Count missing items
        quantity_issues: 0,     // NEW: Count quantity discrepancies
        pricing_issues: 0       // NEW: Count pricing discrepancies
      };
    }
    
    const diff = parseFloat(disc.difference_amount) || 0;
    
    breakdown[category].contractor_total += parseFloat(disc.contractor_total) || 0;
    breakdown[category].carrier_total += parseFloat(disc.carrier_total) || 0;
    breakdown[category].difference += diff;
    breakdown[category].count++;
    
    // Track underpayment vs overpayment
    if (diff > 0) {
      breakdown[category].underpayment += diff;
    } else if (diff < 0) {
      breakdown[category].overpayment += Math.abs(diff);
    }
    
    // Track discrepancy types
    if (disc.discrepancy_type === 'missing_item') {
      breakdown[category].missing_items++;
    } else if (disc.discrepancy_type === 'quantity_difference') {
      breakdown[category].quantity_issues++;
    } else if (disc.discrepancy_type === 'pricing_difference') {
      breakdown[category].pricing_issues++;
    }
  }
  
  // Round all values and calculate percentages
  for (const category in breakdown) {
    breakdown[category].contractor_total = parseFloat(breakdown[category].contractor_total.toFixed(2));
    breakdown[category].carrier_total = parseFloat(breakdown[category].carrier_total.toFixed(2));
    breakdown[category].difference = parseFloat(breakdown[category].difference.toFixed(2));
    breakdown[category].underpayment = parseFloat(breakdown[category].underpayment.toFixed(2));
    breakdown[category].overpayment = parseFloat(breakdown[category].overpayment.toFixed(2));
    
    // Calculate percentage of total underpayment
    breakdown[category].underpayment_percent = breakdown[category].carrier_total > 0
      ? parseFloat(((breakdown[category].underpayment / breakdown[category].carrier_total) * 100).toFixed(2))
      : 0;
  }
  
  // Sort by underpayment amount (highest first)
  const sortedBreakdown = Object.entries(breakdown)
    .sort(([, a], [, b]) => b.underpayment - a.underpayment)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  
  return sortedBreakdown;
}

/**
 * Validate reconciliation results
 * Ensures all math is correct
 */
function validateReconciliation(reconciliation) {
  const errors = [];
  
  // Validate totals match sum of discrepancies
  const sumContractor = reconciliation.discrepancies.reduce(
    (sum, d) => sum + (parseFloat(d.contractor_total) || 0), 0
  );
  const sumCarrier = reconciliation.discrepancies.reduce(
    (sum, d) => sum + (parseFloat(d.carrier_total) || 0), 0
  );
  
  const tolerance = 0.01;
  
  if (Math.abs(sumContractor - reconciliation.totals.contractor_total) > tolerance) {
    errors.push(`Contractor total mismatch: ${sumContractor} vs ${reconciliation.totals.contractor_total}`);
  }
  
  if (Math.abs(sumCarrier - reconciliation.totals.carrier_total) > tolerance) {
    errors.push(`Carrier total mismatch: ${sumCarrier} vs ${reconciliation.totals.carrier_total}`);
  }
  
  // Validate underpayment calculation
  const calculatedUnderpayment = reconciliation.discrepancies
    .filter(d => (parseFloat(d.difference_amount) || 0) > 0)
    .reduce((sum, d) => sum + parseFloat(d.difference_amount), 0);
  
  if (Math.abs(calculatedUnderpayment - reconciliation.totals.underpayment_amount) > tolerance) {
    errors.push(`Underpayment calculation mismatch: ${calculatedUnderpayment} vs ${reconciliation.totals.underpayment_amount}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate summary statistics
 */
function generateSummary(reconciliation) {
  const totals = reconciliation.totals;
  const stats = reconciliation.stats;
  
  return {
    total_items_compared: stats.total_discrepancies,
    items_with_discrepancies: stats.total_discrepancies,
    
    financial_summary: {
      contractor_total: totals.contractor_total,
      carrier_total: totals.carrier_total,
      net_difference: totals.net_difference,
      underpayment: totals.underpayment_amount,
      overpayment: totals.overpayment_amount
    },
    
    discrepancy_breakdown: {
      missing_items: stats.missing_items,
      extra_items: stats.extra_items,
      quantity_differences: stats.quantity_differences,
      pricing_differences: stats.pricing_differences,
      scope_differences: stats.scope_differences
    },
    
    top_discrepancies: reconciliation.discrepancies
      .sort((a, b) => Math.abs(b.difference_amount) - Math.abs(a.difference_amount))
      .slice(0, 10)
      .map(d => ({
        description: d.line_item_description,
        category: d.category,
        type: d.discrepancy_type,
        difference: d.difference_amount
      }))
  };
}

module.exports = {
  reconcileEstimates,
  calculateDiscrepancy,
  calculateTotals,
  calculateCategoryBreakdown,
  validateReconciliation,
  generateSummary
};

/**
 * Estimate Reconciler - Deterministic Financial Reconciliation Engine
 * All math is computed in code, not by AI
 */

/**
 * Reconcile matched line items and calculate discrepancies
 * @param {Array} matches - Matched line items from matcher
 * @param {Array} unmatchedContractor - Unmatched contractor items
 * @param {Array} unmatchedCarrier - Unmatched carrier items
 * @returns {object} Reconciliation results with deterministic calculations
 */
function reconcileEstimates(matches, unmatchedContractor, unmatchedCarrier) {
  const discrepancies = [];
  
  // Process matched items
  for (const match of matches) {
    const contractor = match.contractor;
    const carrier = match.carrier;
    
    // Calculate discrepancies
    const discrepancy = calculateDiscrepancy(contractor, carrier, match);
    
    if (discrepancy) {
      discrepancies.push({
        ...discrepancy,
        match_confidence: match.match_confidence,
        match_method: match.match_method
      });
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
  
  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(discrepancies);
  
  return {
    discrepancies,
    totals,
    categoryBreakdown,
    stats: {
      total_discrepancies: discrepancies.length,
      missing_items: discrepancies.filter(d => d.discrepancy_type === 'missing_item').length,
      extra_items: discrepancies.filter(d => d.discrepancy_type === 'extra_item').length,
      quantity_differences: discrepancies.filter(d => d.discrepancy_type === 'quantity_difference').length,
      pricing_differences: discrepancies.filter(d => d.discrepancy_type === 'pricing_difference').length,
      scope_differences: discrepancies.filter(d => d.discrepancy_type === 'scope_omission').length
    }
  };
}

/**
 * Calculate discrepancy for a matched pair
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
 * Generate human-readable notes for discrepancy
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
 * Calculate category breakdown
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
        count: 0
      };
    }
    
    breakdown[category].contractor_total += parseFloat(disc.contractor_total) || 0;
    breakdown[category].carrier_total += parseFloat(disc.carrier_total) || 0;
    breakdown[category].difference += parseFloat(disc.difference_amount) || 0;
    breakdown[category].count++;
  }
  
  // Round all values
  for (const category in breakdown) {
    breakdown[category].contractor_total = parseFloat(breakdown[category].contractor_total.toFixed(2));
    breakdown[category].carrier_total = parseFloat(breakdown[category].carrier_total.toFixed(2));
    breakdown[category].difference = parseFloat(breakdown[category].difference.toFixed(2));
  }
  
  return breakdown;
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

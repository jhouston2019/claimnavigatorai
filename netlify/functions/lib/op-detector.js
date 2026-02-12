/**
 * Overhead & Profit (O&P) Detection Engine
 * Detects O&P application and calculates gaps
 */

/**
 * Detect O&P in line items
 * @param {Array} lineItems - Parsed line items
 * @returns {object} O&P detection results
 */
function detectOP(lineItems) {
  const opLines = [];
  let overheadAmount = 0;
  let profitAmount = 0;
  let overheadPercent = null;
  let profitPercent = null;
  let subtotalBeforeOP = 0;
  
  // Look for O&P line items
  for (const item of lineItems) {
    const desc = item.description.toLowerCase();
    
    // Detect overhead
    if (desc.includes('overhead') || desc.includes('o&p') || desc.includes('o & p')) {
      opLines.push(item);
      
      if (desc.includes('overhead') && !desc.includes('profit')) {
        overheadAmount += item.total || 0;
        
        // Try to extract percentage from description
        const percentMatch = desc.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) {
          overheadPercent = parseFloat(percentMatch[1]);
        }
      }
    }
    
    // Detect profit
    if (desc.includes('profit') || desc.includes('o&p') || desc.includes('o & p')) {
      opLines.push(item);
      
      if (desc.includes('profit') && !desc.includes('overhead')) {
        profitAmount += item.total || 0;
        
        // Try to extract percentage from description
        const percentMatch = desc.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) {
          profitPercent = parseFloat(percentMatch[1]);
        }
      }
    }
    
    // Combined O&P line
    if ((desc.includes('o&p') || desc.includes('o & p')) && 
        !desc.includes('overhead') && !desc.includes('profit')) {
      // This is a combined O&P line
      const combinedAmount = item.total || 0;
      
      // Try to extract percentages
      const percentMatches = desc.match(/(\d+(?:\.\d+)?)\s*%/g);
      if (percentMatches && percentMatches.length >= 2) {
        overheadPercent = parseFloat(percentMatches[0].replace('%', ''));
        profitPercent = parseFloat(percentMatches[1].replace('%', ''));
      } else if (percentMatches && percentMatches.length === 1) {
        // Single percentage, assume it's combined
        const combined = parseFloat(percentMatches[0].replace('%', ''));
        overheadPercent = combined / 2;
        profitPercent = combined / 2;
      }
      
      // Split amount if we have percentages
      if (overheadPercent && profitPercent) {
        const totalPercent = overheadPercent + profitPercent;
        overheadAmount += combinedAmount * (overheadPercent / totalPercent);
        profitAmount += combinedAmount * (profitPercent / totalPercent);
      } else {
        // Assume 50/50 split
        overheadAmount += combinedAmount / 2;
        profitAmount += combinedAmount / 2;
      }
    }
    
    // Track subtotal before O&P
    if (item.is_subtotal && !desc.includes('overhead') && !desc.includes('profit')) {
      subtotalBeforeOP = item.total || 0;
    }
  }
  
  // Calculate percentages if we have subtotal
  if (subtotalBeforeOP > 0) {
    if (!overheadPercent && overheadAmount > 0) {
      overheadPercent = (overheadAmount / subtotalBeforeOP) * 100;
    }
    if (!profitPercent && profitAmount > 0) {
      profitPercent = (profitAmount / subtotalBeforeOP) * 100;
    }
  }
  
  const hasOP = opLines.length > 0 || overheadAmount > 0 || profitAmount > 0;
  
  return {
    has_op: hasOP,
    overhead_amount: parseFloat(overheadAmount.toFixed(2)),
    profit_amount: parseFloat(profitAmount.toFixed(2)),
    total_op_amount: parseFloat((overheadAmount + profitAmount).toFixed(2)),
    overhead_percent: overheadPercent ? parseFloat(overheadPercent.toFixed(2)) : null,
    profit_percent: profitPercent ? parseFloat(profitPercent.toFixed(2)) : null,
    combined_percent: (overheadPercent && profitPercent) 
      ? parseFloat((overheadPercent + profitPercent).toFixed(2))
      : null,
    subtotal_before_op: parseFloat(subtotalBeforeOP.toFixed(2)),
    op_line_items: opLines.map(item => ({
      line_number: item.line_number,
      description: item.description,
      amount: item.total
    }))
  };
}

/**
 * Calculate O&P gap between contractor and carrier
 * @param {object} contractorOP - Contractor O&P detection
 * @param {object} carrierOP - Carrier O&P detection
 * @param {number} contractorSubtotal - Contractor subtotal before O&P
 * @param {number} carrierSubtotal - Carrier subtotal before O&P
 * @returns {object} O&P gap analysis
 */
function calculateOPGap(contractorOP, carrierOP, contractorSubtotal, carrierSubtotal) {
  // Determine if O&P should be applied
  const contractorHasOP = contractorOP.has_op;
  const carrierHasOP = carrierOP.has_op;
  
  // Calculate expected O&P if carrier should have applied it
  let expectedCarrierOP = 0;
  let expectedOverhead = 0;
  let expectedProfit = 0;
  
  if (contractorHasOP && !carrierHasOP) {
    // Carrier should have O&P but doesn't
    // Use contractor's percentages if available, otherwise use industry standard (10% + 10%)
    const overheadPercent = contractorOP.overhead_percent || 10;
    const profitPercent = contractorOP.profit_percent || 10;
    
    expectedOverhead = (carrierSubtotal || carrierOP.subtotal_before_op) * (overheadPercent / 100);
    expectedProfit = (carrierSubtotal || carrierOP.subtotal_before_op) * (profitPercent / 100);
    expectedCarrierOP = expectedOverhead + expectedProfit;
  }
  
  // Calculate actual gap
  const opGap = contractorOP.total_op_amount - carrierOP.total_op_amount;
  
  // Determine gap type
  let gapType = 'none';
  let gapDescription = '';
  
  if (contractorHasOP && !carrierHasOP) {
    gapType = 'missing_op';
    gapDescription = `Carrier estimate missing O&P. Contractor includes ${contractorOP.combined_percent || 20}% O&P.`;
  } else if (contractorHasOP && carrierHasOP && Math.abs(opGap) > 100) {
    gapType = 'op_difference';
    gapDescription = `O&P difference: Contractor ${contractorOP.combined_percent}% vs Carrier ${carrierOP.combined_percent}%`;
  } else if (!contractorHasOP && carrierHasOP) {
    gapType = 'carrier_only_op';
    gapDescription = `Carrier applied O&P but contractor did not include it separately`;
  }
  
  return {
    has_gap: Math.abs(opGap) > 100 || (contractorHasOP && !carrierHasOP),
    gap_type: gapType,
    gap_description: gapDescription,
    
    contractor: {
      has_op: contractorHasOP,
      overhead_amount: contractorOP.overhead_amount,
      profit_amount: contractorOP.profit_amount,
      total_op: contractorOP.total_op_amount,
      overhead_percent: contractorOP.overhead_percent,
      profit_percent: contractorOP.profit_percent,
      combined_percent: contractorOP.combined_percent
    },
    
    carrier: {
      has_op: carrierHasOP,
      overhead_amount: carrierOP.overhead_amount,
      profit_amount: carrierOP.profit_amount,
      total_op: carrierOP.total_op_amount,
      overhead_percent: carrierOP.overhead_percent,
      profit_percent: carrierOP.profit_percent,
      combined_percent: carrierOP.combined_percent
    },
    
    gap: {
      overhead_gap: parseFloat((contractorOP.overhead_amount - carrierOP.overhead_amount).toFixed(2)),
      profit_gap: parseFloat((contractorOP.profit_amount - carrierOP.profit_amount).toFixed(2)),
      total_op_gap: parseFloat(opGap.toFixed(2)),
      expected_carrier_op: parseFloat(expectedCarrierOP.toFixed(2)),
      expected_overhead: parseFloat(expectedOverhead.toFixed(2)),
      expected_profit: parseFloat(expectedProfit.toFixed(2))
    },
    
    recommendation: generateOPRecommendation(gapType, opGap, contractorOP, carrierOP)
  };
}

/**
 * Generate recommendation for O&P gap
 * @param {string} gapType 
 * @param {number} opGap 
 * @param {object} contractorOP 
 * @param {object} carrierOP 
 * @returns {string}
 */
function generateOPRecommendation(gapType, opGap, contractorOP, carrierOP) {
  switch (gapType) {
    case 'missing_op':
      return `Request carrier to apply ${contractorOP.combined_percent || 20}% O&P to match industry standard and contractor estimate. This represents $${Math.abs(opGap).toFixed(2)} in missing compensation.`;
    
    case 'op_difference':
      return `Carrier O&P rate (${carrierOP.combined_percent}%) is below contractor rate (${contractorOP.combined_percent}%). Request adjustment to match contractor's rate or provide justification for lower rate.`;
    
    case 'carrier_only_op':
      return `Review if contractor's pricing already includes O&P in line item rates. If not, this may represent an overpayment by carrier.`;
    
    default:
      return 'O&P rates appear aligned between estimates.';
  }
}

/**
 * Detect if O&P is embedded in line item pricing
 * @param {Array} lineItems 
 * @returns {object}
 */
function detectEmbeddedOP(lineItems) {
  // Look for clues that O&P is embedded
  let hasLaborItems = false;
  let hasMaterialItems = false;
  let averageMarkup = 0;
  let markupCount = 0;
  
  for (const item of lineItems) {
    if (item.category === 'Labor') hasLaborItems = true;
    if (item.category === 'Materials') hasMaterialItems = true;
    
    // Check if pricing seems to include markup
    // This is heuristic-based
    if (item.unit_price && item.quantity) {
      // Industry standard material costs vs typical pricing
      // This would need historical data for accuracy
    }
  }
  
  return {
    likely_embedded: hasLaborItems && hasMaterialItems && !hasExplicitOP(lineItems),
    confidence: 'low', // Would need historical data for higher confidence
    note: 'O&P may be embedded in line item pricing. Requires contractor confirmation.'
  };
}

/**
 * Check if estimate has explicit O&P line items
 * @param {Array} lineItems 
 * @returns {boolean}
 */
function hasExplicitOP(lineItems) {
  return lineItems.some(item => {
    const desc = item.description.toLowerCase();
    return desc.includes('overhead') || desc.includes('profit') || 
           desc.includes('o&p') || desc.includes('o & p');
  });
}

/**
 * Calculate recommended O&P based on industry standards
 * @param {number} subtotal 
 * @param {string} claimType - 'residential' | 'commercial'
 * @returns {object}
 */
function calculateRecommendedOP(subtotal, claimType = 'residential') {
  // Industry standard O&P rates
  const rates = {
    residential: {
      overhead: 10,
      profit: 10,
      combined: 20
    },
    commercial: {
      overhead: 15,
      profit: 10,
      combined: 25
    }
  };
  
  const rate = rates[claimType] || rates.residential;
  
  const overhead = subtotal * (rate.overhead / 100);
  const profit = subtotal * (rate.profit / 100);
  const total = overhead + profit;
  
  return {
    overhead_percent: rate.overhead,
    profit_percent: rate.profit,
    combined_percent: rate.combined,
    overhead_amount: parseFloat(overhead.toFixed(2)),
    profit_amount: parseFloat(profit.toFixed(2)),
    total_op_amount: parseFloat(total.toFixed(2)),
    subtotal: subtotal,
    total_with_op: parseFloat((subtotal + total).toFixed(2))
  };
}

module.exports = {
  detectOP,
  calculateOPGap,
  detectEmbeddedOP,
  hasExplicitOP,
  calculateRecommendedOP,
  generateOPRecommendation
};

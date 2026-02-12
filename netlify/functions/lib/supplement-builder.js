/**
 * Supplement Builder 2.0
 * Professional negotiation-grade supplement generator
 * Uses structured data from Estimate Engine v2.1
 * ALL MATH IS DETERMINISTIC - AI ONLY FORMATS
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Build structured supplement from database
 * @param {string} claimId - Claim UUID
 * @param {object} supabaseClient - Supabase client
 * @returns {object} Structured supplement data
 */
async function buildSupplement(claimId, supabaseClient) {
  // =====================================================
  // STEP 1: PULL ALL DATA FROM DATABASE
  // =====================================================
  
  // Get claim info
  const { data: claim, error: claimError } = await supabaseClient
    .from('claims')
    .select('*')
    .eq('id', claimId)
    .single();
  
  if (claimError || !claim) {
    throw new Error('Claim not found');
  }
  
  // Get discrepancies
  const { data: discrepancies, error: discError } = await supabaseClient
    .from('claim_estimate_discrepancies')
    .select('*')
    .eq('claim_id', claimId)
    .order('difference_amount', { ascending: false });
  
  if (discError) {
    throw new Error('Failed to fetch discrepancies');
  }
  
  // Get financial summary
  const { data: financialSummary, error: finError } = await supabaseClient
    .from('claim_financial_summary')
    .select('*')
    .eq('claim_id', claimId)
    .single();
  
  // Get comparison data (includes O&P analysis)
  const { data: comparison, error: compError } = await supabaseClient
    .from('claim_estimate_comparison')
    .select('*')
    .eq('claim_id', claimId)
    .single();
  
  // Get line items for reference
  const { data: contractorLines, error: cLineError } = await supabaseClient
    .from('claim_estimate_line_items')
    .select('*')
    .eq('claim_id', claimId)
    .eq('estimate_type', 'contractor');
  
  const { data: carrierLines, error: caLineError } = await supabaseClient
    .from('claim_estimate_line_items')
    .select('*')
    .eq('claim_id', claimId)
    .eq('estimate_type', 'carrier');
  
  // =====================================================
  // STEP 2: AGGREGATE DATA BY CATEGORY
  // =====================================================
  
  const categoryData = aggregateByCategory(discrepancies);
  
  // =====================================================
  // STEP 3: CALCULATE TOTALS (DETERMINISTIC)
  // =====================================================
  
  const totals = calculateSupplementTotals(
    discrepancies,
    comparison,
    financialSummary
  );
  
  // =====================================================
  // STEP 4: BUILD STRUCTURED SECTIONS
  // =====================================================
  
  const sections = buildSupplementSections(
    categoryData,
    comparison,
    financialSummary,
    claim
  );
  
  // =====================================================
  // STEP 5: RETURN STRUCTURED DATA
  // =====================================================
  
  return {
    claim_info: {
      claim_number: claim.claim_number,
      loss_date: claim.loss_date,
      policyholder_name: claim.policyholder_name || 'Policyholder',
      carrier_name: claim.carrier_name || 'Insurance Carrier',
      adjuster_name: claim.adjuster_name
    },
    
    totals: {
      total_supplement_request: totals.total_supplement_request,
      underpayment_estimate: totals.underpayment_estimate,
      op_gap: totals.op_gap,
      depreciation_impact: totals.depreciation_impact,
      header_discrepancy: totals.header_discrepancy
    },
    
    category_breakdown: categoryData,
    
    sections: sections,
    
    metadata: {
      total_discrepancies: discrepancies.length,
      categories_affected: Object.keys(categoryData).length,
      generated_at: new Date().toISOString(),
      engine_version: '2.1',
      supplement_version: '2.0'
    }
  };
}

/**
 * Aggregate discrepancies by category
 * @param {Array} discrepancies 
 * @returns {object}
 */
function aggregateByCategory(discrepancies) {
  const categories = {};
  
  for (const disc of discrepancies) {
    const category = disc.category || 'Other';
    
    if (!categories[category]) {
      categories[category] = {
        category_name: category,
        total_underpayment: 0,
        missing_items: [],
        quantity_issues: [],
        unit_price_issues: [],
        scope_variations: [],
        unit_incompatibilities: []
      };
    }
    
    const cat = categories[category];
    
    // Add to total
    if (disc.difference_amount > 0) {
      cat.total_underpayment += disc.difference_amount;
    }
    
    // Categorize by type
    const item = {
      line_item_description: disc.line_item_description,
      contractor_line_id: disc.contractor_line_id,
      carrier_line_id: disc.carrier_line_id,
      contractor_quantity: disc.contractor_quantity,
      carrier_quantity: disc.carrier_quantity,
      contractor_unit: disc.contractor_unit || disc.contractor_unit_original,
      carrier_unit: disc.carrier_unit || disc.carrier_unit_original,
      contractor_unit_price: disc.contractor_unit_price,
      carrier_unit_price: disc.carrier_unit_price,
      contractor_total: disc.contractor_total,
      carrier_total: disc.carrier_total,
      delta_amount: disc.difference_amount,
      notes: disc.notes,
      unit_conversion_applied: disc.unit_conversion_applied || false
    };
    
    switch (disc.discrepancy_type) {
      case 'missing_item':
        cat.missing_items.push(item);
        break;
      
      case 'quantity_difference':
        cat.quantity_issues.push(item);
        break;
      
      case 'pricing_difference':
        cat.unit_price_issues.push(item);
        break;
      
      case 'scope_omission':
        cat.scope_variations.push(item);
        break;
      
      case 'unit_incompatible':
        cat.unit_incompatibilities.push(item);
        break;
      
      default:
        cat.scope_variations.push(item);
    }
  }
  
  // Round totals
  for (const category in categories) {
    categories[category].total_underpayment = parseFloat(
      categories[category].total_underpayment.toFixed(2)
    );
  }
  
  // Sort by underpayment (highest first)
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b.total_underpayment - a.total_underpayment)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  
  return sortedCategories;
}

/**
 * Calculate supplement totals (DETERMINISTIC)
 * @param {Array} discrepancies 
 * @param {object} comparison 
 * @param {object} financialSummary 
 * @returns {object}
 */
function calculateSupplementTotals(discrepancies, comparison, financialSummary) {
  // Base underpayment from discrepancies
  const underpayment = discrepancies
    .filter(d => d.difference_amount > 0)
    .reduce((sum, d) => sum + d.difference_amount, 0);
  
  // O&P gap from comparison
  const opGap = comparison?.category_breakdown 
    ? extractOPGap(comparison.category_breakdown)
    : 0;
  
  // Depreciation impact (if available)
  const depreciationImpact = financialSummary?.depreciation_outstanding || 0;
  
  // Header discrepancy (if validation failed)
  const headerDiscrepancy = 0; // Would come from validation data
  
  // TOTAL = underpayment + O&P gap + depreciation issues
  const totalSupplementRequest = underpayment + opGap + depreciationImpact;
  
  return {
    underpayment_estimate: parseFloat(underpayment.toFixed(2)),
    op_gap: parseFloat(opGap.toFixed(2)),
    depreciation_impact: parseFloat(depreciationImpact.toFixed(2)),
    header_discrepancy: parseFloat(headerDiscrepancy.toFixed(2)),
    total_supplement_request: parseFloat(totalSupplementRequest.toFixed(2))
  };
}

/**
 * Extract O&P gap from category breakdown
 * @param {object} categoryBreakdown 
 * @returns {number}
 */
function extractOPGap(categoryBreakdown) {
  // O&P gap would be stored separately in comparison data
  // For now, return 0 if not available
  return 0;
}

/**
 * Build structured supplement sections
 * @param {object} categoryData 
 * @param {object} comparison 
 * @param {object} financialSummary 
 * @param {object} claim 
 * @returns {object}
 */
function buildSupplementSections(categoryData, comparison, financialSummary, claim) {
  const sections = {
    header: buildHeaderSection(claim),
    introduction: buildIntroductionSection(),
    categories: buildCategorySections(categoryData),
    op_section: buildOPSection(comparison),
    depreciation_section: buildDepreciationSection(financialSummary),
    header_validation: buildHeaderValidationSection(comparison),
    summary: buildSummarySection(categoryData, comparison, financialSummary)
  };
  
  return sections;
}

/**
 * Build header section
 */
function buildHeaderSection(claim) {
  return {
    subject: `Supplement Request – Claim #${claim.claim_number}`,
    carrier: claim.carrier_name || 'Insurance Carrier',
    loss_date: claim.loss_date ? new Date(claim.loss_date).toLocaleDateString() : 'N/A',
    adjuster: claim.adjuster_name || 'Claims Adjuster'
  };
}

/**
 * Build introduction section
 */
function buildIntroductionSection() {
  return {
    text: 'This supplement is submitted in response to discrepancies identified during a structured reconciliation of the carrier estimate against contractor scope. The following scope deficiencies and valuation gaps have been identified through deterministic line-item analysis.'
  };
}

/**
 * Build category sections
 */
function buildCategorySections(categoryData) {
  const sections = [];
  
  for (const [categoryName, data] of Object.entries(categoryData)) {
    const section = {
      category_name: categoryName,
      total_underpayment: data.total_underpayment,
      items: []
    };
    
    // Add missing items
    for (const item of data.missing_items) {
      section.items.push({
        type: 'missing_scope',
        description: item.line_item_description,
        carrier_line: item.carrier_line_id ? `Line ${item.carrier_line_id}` : 'Not in carrier estimate',
        contractor_quantity: item.contractor_quantity,
        contractor_unit: item.contractor_unit,
        contractor_unit_price: item.contractor_unit_price,
        delta: item.delta_amount,
        note: `Missing Scope: ${item.line_item_description}`
      });
    }
    
    // Add quantity issues
    for (const item of data.quantity_issues) {
      section.items.push({
        type: 'quantity_understated',
        description: item.line_item_description,
        carrier_line: item.carrier_line_id ? `Line ${item.carrier_line_id}` : 'N/A',
        contractor_quantity: item.contractor_quantity,
        carrier_quantity: item.carrier_quantity,
        unit: item.contractor_unit,
        delta: item.delta_amount,
        note: `Quantity understated (Carrier: ${item.carrier_quantity} ${item.carrier_unit}, Contractor: ${item.contractor_quantity} ${item.contractor_unit})`
      });
    }
    
    // Add unit price issues
    for (const item of data.unit_price_issues) {
      section.items.push({
        type: 'unit_price_below_market',
        description: item.line_item_description,
        carrier_line: item.carrier_line_id ? `Line ${item.carrier_line_id}` : 'N/A',
        contractor_unit_price: item.contractor_unit_price,
        carrier_unit_price: item.carrier_unit_price,
        unit: item.contractor_unit,
        delta: item.delta_amount,
        note: `Unit pricing below market rate (Carrier: $${item.carrier_unit_price.toFixed(2)}/${item.carrier_unit}, Contractor: $${item.contractor_unit_price.toFixed(2)}/${item.contractor_unit})`
      });
    }
    
    // Add scope variations
    for (const item of data.scope_variations) {
      section.items.push({
        type: 'scope_variation',
        description: item.line_item_description,
        carrier_line: item.carrier_line_id ? `Line ${item.carrier_line_id}` : 'N/A',
        delta: item.delta_amount,
        note: item.notes || 'Scope variation detected'
      });
    }
    
    sections.push(section);
  }
  
  return sections;
}

/**
 * Build O&P section
 */
function buildOPSection(comparison) {
  if (!comparison || !comparison.category_breakdown) {
    return null;
  }
  
  // Extract O&P data from comparison
  // This would come from the O&P analysis stored in comparison
  const opGap = 0; // Placeholder - would extract from comparison.op_analysis
  
  if (opGap === 0) {
    return null;
  }
  
  return {
    title: 'Overhead & Profit Gap',
    amount: opGap,
    description: 'Carrier estimate does not apply general contractor overhead and profit at appropriate rates for a multi-trade project. Industry standard O&P of 20% (10% overhead + 10% profit) should be applied to the total scope.'
  };
}

/**
 * Build depreciation section
 */
function buildDepreciationSection(financialSummary) {
  if (!financialSummary || !financialSummary.depreciation_outstanding) {
    return null;
  }
  
  const depreciationImpact = financialSummary.depreciation_outstanding;
  
  if (depreciationImpact === 0) {
    return null;
  }
  
  return {
    title: 'Depreciation Miscalculation',
    amount: depreciationImpact,
    description: 'Carrier depreciation exceeds reasonable useful life standards for the affected materials. Request adjustment to industry-standard depreciation schedules or full RCV payment per policy terms.'
  };
}

/**
 * Build header validation section
 */
function buildHeaderValidationSection(comparison) {
  // Would check validation data from comparison
  // Placeholder for now
  return null;
}

/**
 * Build summary section
 */
function buildSummarySection(categoryData, comparison, financialSummary) {
  const totalUnderpayment = Object.values(categoryData)
    .reduce((sum, cat) => sum + cat.total_underpayment, 0);
  
  const opGap = 0; // Would extract from comparison
  const depreciationImpact = financialSummary?.depreciation_outstanding || 0;
  
  const totalRequest = totalUnderpayment + opGap + depreciationImpact;
  
  return {
    total_supplement_requested: parseFloat(totalRequest.toFixed(2)),
    breakdown: {
      scope_discrepancies: parseFloat(totalUnderpayment.toFixed(2)),
      op_gap: parseFloat(opGap.toFixed(2)),
      depreciation_adjustment: parseFloat(depreciationImpact.toFixed(2))
    },
    closing: 'Please review the above discrepancies and issue revised payment accordingly. All calculations are based on deterministic line-item reconciliation and industry-standard pricing.'
  };
}

module.exports = {
  buildSupplement,
  aggregateByCategory,
  calculateSupplementTotals,
  buildSupplementSections
};

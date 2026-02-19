/**
 * Carrier Pattern Detection Engine
 * Detects systemic carrier behavior patterns
 * Tracks O&P omission, labor depreciation, price suppression
 * 
 * NO AI - Statistical pattern detection only
 */

/**
 * Analyze carrier patterns from current and historical data
 * @param {object} params - Input parameters
 * @returns {object} Pattern analysis
 */
function analyzeCarrierPatterns(params) {
  const {
    carrierName = '',
    reconciliation = {},
    exposure = {},
    historicalData = [],
    supabase = null
  } = params;
  
  const patternFlags = [];
  let severityScore = 0;
  
  // =====================================================
  // PATTERN 1: O&P OMISSION FREQUENCY
  // =====================================================
  const opPattern = detectOPOmissionPattern(carrierName, reconciliation, historicalData);
  if (opPattern.detected) {
    patternFlags.push(opPattern);
    severityScore += opPattern.severity;
  }
  
  // =====================================================
  // PATTERN 2: LABOR DEPRECIATION
  // =====================================================
  const laborDepPattern = detectLaborDepreciationPattern(reconciliation);
  if (laborDepPattern.detected) {
    patternFlags.push(laborDepPattern);
    severityScore += laborDepPattern.severity;
  }
  
  // =====================================================
  // PATTERN 3: PRICE SUPPRESSION BY TRADE
  // =====================================================
  const pricePattern = detectPriceSuppressionPattern(reconciliation, historicalData);
  if (pricePattern.detected) {
    patternFlags.push(pricePattern);
    severityScore += pricePattern.severity;
  }
  
  // =====================================================
  // PATTERN 4: CATEGORY OMISSION
  // =====================================================
  const omissionPattern = detectCategoryOmissionPattern(reconciliation);
  if (omissionPattern.detected) {
    patternFlags.push(omissionPattern);
    severityScore += omissionPattern.severity;
  }
  
  // =====================================================
  // PATTERN 5: AVERAGE VARIANCE
  // =====================================================
  const variancePattern = calculateAverageVariance(reconciliation, historicalData);
  if (variancePattern.detected) {
    patternFlags.push(variancePattern);
    severityScore += variancePattern.severity;
  }
  
  return {
    carrierName: carrierName,
    patternFlags: patternFlags,
    severityScore: severityScore,
    riskLevel: calculateRiskLevel(severityScore),
    patternCount: patternFlags.length,
    metadata: {
      engine_version: '1.0',
      analysis_method: 'statistical',
      patterns_evaluated: 5
    }
  };
}

/**
 * Detect O&P omission pattern
 */
function detectOPOmissionPattern(carrierName, reconciliation, historicalData) {
  const opAnalysis = reconciliation.opAnalysis || {};
  const carrierHasOP = opAnalysis.carrier?.has_op || false;
  const contractorHasOP = opAnalysis.contractor?.has_op || false;
  
  // Current claim: carrier missing O&P
  if (contractorHasOP && !carrierHasOP) {
    // Check historical frequency (if available)
    let historicalOmissionRate = 0;
    if (historicalData.length > 0) {
      const omissions = historicalData.filter(h => 
        h.carrier_name === carrierName && 
        h.contractor_has_op && 
        !h.carrier_has_op
      );
      historicalOmissionRate = (omissions.length / historicalData.length) * 100;
    }
    
    const confidence = historicalOmissionRate > 50 ? 'high' : 
                       historicalOmissionRate > 25 ? 'medium' : 'low';
    
    return {
      detected: true,
      pattern: 'Systemic O&P Omission',
      category: 'op_omission',
      confidence: confidence,
      explanation: `Carrier ${carrierName} omitted O&P from estimate despite multi-trade project.${historicalOmissionRate > 0 ? ` Historical data shows ${historicalOmissionRate.toFixed(1)}% omission rate.` : ''}`,
      severity: 3,
      currentClaim: {
        carrier_has_op: false,
        contractor_has_op: true,
        op_gap: opAnalysis.gap?.total_op_gap || 0
      },
      historical: {
        omission_rate: historicalOmissionRate,
        sample_size: historicalData.length
      }
    };
  }
  
  return { detected: false };
}

/**
 * Detect labor depreciation pattern
 */
function detectLaborDepreciationPattern(reconciliation) {
  const discrepancies = reconciliation.discrepancies || [];
  
  // Check if carrier depreciated labor items
  const laborDepreciated = discrepancies.filter(disc => {
    const isLabor = disc.category === 'Labor' || 
                    disc.line_item_description?.toLowerCase().includes('labor');
    const hasDepreciation = (disc.carrier_depreciation || 0) > 0;
    return isLabor && hasDepreciation;
  });
  
  if (laborDepreciated.length > 0) {
    const totalLaborDepreciation = laborDepreciated.reduce((sum, d) => 
      sum + (d.carrier_depreciation || 0), 0
    );
    
    return {
      detected: true,
      pattern: 'Labor Depreciation Applied',
      category: 'labor_depreciation',
      confidence: 'high',
      explanation: `Carrier incorrectly applied depreciation to ${laborDepreciated.length} labor item(s). Labor is typically not depreciated in insurance claims.`,
      severity: 2,
      labor_items_affected: laborDepreciated.length,
      total_labor_depreciation: parseFloat(totalLaborDepreciation.toFixed(2))
    };
  }
  
  return { detected: false };
}

/**
 * Detect price suppression by trade
 */
function detectPriceSuppressionPattern(reconciliation, historicalData) {
  const categoryBreakdown = reconciliation.categoryBreakdown || {};
  const suppressedCategories = [];
  
  for (const [category, data] of Object.entries(categoryBreakdown)) {
    const contractorTotal = data.contractor_total || 0;
    const carrierTotal = data.carrier_total || 0;
    
    if (contractorTotal === 0) continue;
    
    const variance = ((contractorTotal - carrierTotal) / contractorTotal) * 100;
    
    // Flag if carrier is >12% below contractor in any category
    if (variance > 12) {
      suppressedCategories.push({
        category: category,
        variance_percent: parseFloat(variance.toFixed(2)),
        contractor_total: contractorTotal,
        carrier_total: carrierTotal,
        delta: contractorTotal - carrierTotal
      });
    }
  }
  
  if (suppressedCategories.length > 0) {
    // Sort by variance descending
    suppressedCategories.sort((a, b) => b.variance_percent - a.variance_percent);
    
    const topCategory = suppressedCategories[0];
    
    return {
      detected: true,
      pattern: 'Systemic Price Suppression',
      category: 'price_suppression',
      confidence: suppressedCategories.length >= 3 ? 'high' : 'medium',
      explanation: `Carrier pricing is ${topCategory.variance_percent.toFixed(1)}% below contractor in ${topCategory.category}. ${suppressedCategories.length} category(ies) show >12% variance.`,
      severity: suppressedCategories.length >= 3 ? 3 : 2,
      suppressed_categories: suppressedCategories,
      most_suppressed: topCategory.category,
      max_variance: topCategory.variance_percent
    };
  }
  
  return { detected: false };
}

/**
 * Detect category omission pattern
 */
function detectCategoryOmissionPattern(reconciliation) {
  const discrepancies = reconciliation.discrepancies || [];
  
  // Count missing items by category
  const missingByCategory = {};
  
  for (const disc of discrepancies) {
    if (disc.discrepancy_type === 'missing_item') {
      const category = disc.category || 'Other';
      if (!missingByCategory[category]) {
        missingByCategory[category] = {
          count: 0,
          total_value: 0
        };
      }
      missingByCategory[category].count++;
      missingByCategory[category].total_value += disc.contractor_total || 0;
    }
  }
  
  // Flag if 3+ items missing in any single category
  const significantOmissions = Object.entries(missingByCategory)
    .filter(([cat, data]) => data.count >= 3)
    .map(([cat, data]) => ({
      category: cat,
      missing_count: data.count,
      total_value: parseFloat(data.total_value.toFixed(2))
    }));
  
  if (significantOmissions.length > 0) {
    significantOmissions.sort((a, b) => b.total_value - a.total_value);
    const topOmission = significantOmissions[0];
    
    return {
      detected: true,
      pattern: 'Category Omission Pattern',
      category: 'category_omission',
      confidence: 'high',
      explanation: `Carrier omitted ${topOmission.missing_count} ${topOmission.category} items totaling $${topOmission.total_value.toFixed(2)}. Pattern indicates systematic scope reduction.`,
      severity: 2,
      omissions: significantOmissions,
      most_omitted_category: topOmission.category
    };
  }
  
  return { detected: false };
}

/**
 * Calculate average variance
 */
function calculateAverageVariance(reconciliation, historicalData) {
  const totals = reconciliation.totals || {};
  const contractorTotal = totals.contractor_total || 0;
  const carrierTotal = totals.carrier_total || 0;
  
  if (contractorTotal === 0) {
    return { detected: false };
  }
  
  const currentVariance = ((contractorTotal - carrierTotal) / contractorTotal) * 100;
  
  // Calculate historical average (if available)
  let historicalAvgVariance = 0;
  if (historicalData.length > 0) {
    const variances = historicalData.map(h => {
      const cTotal = h.contractor_total || 0;
      const carTotal = h.carrier_total || 0;
      return cTotal > 0 ? ((cTotal - carTotal) / cTotal) * 100 : 0;
    });
    historicalAvgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
  }
  
  // Flag if current variance is significantly above average
  if (currentVariance > 15 || (historicalAvgVariance > 0 && currentVariance > historicalAvgVariance * 1.2)) {
    return {
      detected: true,
      pattern: 'Above-Average Variance',
      category: 'variance',
      confidence: historicalData.length > 5 ? 'high' : 'medium',
      explanation: `Carrier estimate is ${currentVariance.toFixed(1)}% below contractor estimate.${historicalAvgVariance > 0 ? ` Historical average variance: ${historicalAvgVariance.toFixed(1)}%.` : ''} Variance exceeds typical industry range.`,
      severity: currentVariance > 20 ? 3 : 1,
      current_variance: parseFloat(currentVariance.toFixed(2)),
      historical_avg_variance: parseFloat(historicalAvgVariance.toFixed(2)),
      contractor_total: contractorTotal,
      carrier_total: carrierTotal
    };
  }
  
  return { detected: false };
}

/**
 * Calculate risk level from severity score
 */
function calculateRiskLevel(severityScore) {
  if (severityScore >= 8) return 'critical';
  if (severityScore >= 5) return 'high';
  if (severityScore >= 3) return 'medium';
  return 'low';
}

module.exports = {
  analyzeCarrierPatterns,
  detectOPOmissionPattern,
  detectLaborDepreciationPattern,
  detectPriceSuppressionPattern,
  detectCategoryOmissionPattern,
  calculateAverageVariance,
  calculateRiskLevel
};

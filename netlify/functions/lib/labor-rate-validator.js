/**
 * LABOR RATE VALIDATION ENGINE
 * Validates labor rates against regional market data
 * Detects undervalued and overvalued labor pricing
 * 
 * NO AI - Pure rule-based logic with market data comparison
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (for future database integration)
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
} catch (error) {
  console.warn('Supabase not initialized for labor rates:', error.message);
}

// ============================================================================
// REGIONAL LABOR RATES DATABASE
// ============================================================================

const LABOR_RATES = {
  // California
  'CA-San Francisco': {
    'General Contractor': { min: 85, avg: 110, max: 145 },
    'Carpenter': { min: 75, avg: 95, max: 125 },
    'Electrician': { min: 85, avg: 110, max: 140 },
    'Plumber': { min: 80, avg: 105, max: 135 },
    'HVAC Technician': { min: 75, avg: 95, max: 125 },
    'Painter': { min: 55, avg: 75, max: 95 },
    'Drywall Installer': { min: 60, avg: 80, max: 105 },
    'Flooring Installer': { min: 55, avg: 75, max: 100 },
    'Roofer': { min: 65, avg: 85, max: 110 }
  },
  'CA-Los Angeles': {
    'General Contractor': { min: 80, avg: 105, max: 140 },
    'Carpenter': { min: 70, avg: 90, max: 120 },
    'Electrician': { min: 80, avg: 105, max: 135 },
    'Plumber': { min: 75, avg: 100, max: 130 },
    'HVAC Technician': { min: 70, avg: 90, max: 120 },
    'Painter': { min: 50, avg: 70, max: 90 },
    'Drywall Installer': { min: 55, avg: 75, max: 100 },
    'Flooring Installer': { min: 50, avg: 70, max: 95 },
    'Roofer': { min: 60, avg: 80, max: 105 }
  },
  'CA-San Diego': {
    'General Contractor': { min: 75, avg: 100, max: 130 },
    'Carpenter': { min: 65, avg: 85, max: 115 },
    'Electrician': { min: 75, avg: 100, max: 130 },
    'Plumber': { min: 70, avg: 95, max: 125 },
    'HVAC Technician': { min: 65, avg: 85, max: 115 },
    'Painter': { min: 48, avg: 65, max: 85 },
    'Drywall Installer': { min: 52, avg: 70, max: 95 },
    'Flooring Installer': { min: 48, avg: 65, max: 90 },
    'Roofer': { min: 58, avg: 75, max: 100 }
  },
  
  // Texas
  'TX-Houston': {
    'General Contractor': { min: 55, avg: 75, max: 95 },
    'Carpenter': { min: 45, avg: 65, max: 85 },
    'Electrician': { min: 55, avg: 75, max: 95 },
    'Plumber': { min: 50, avg: 70, max: 90 },
    'HVAC Technician': { min: 50, avg: 65, max: 85 },
    'Painter': { min: 35, avg: 50, max: 65 },
    'Drywall Installer': { min: 40, avg: 55, max: 70 },
    'Flooring Installer': { min: 35, avg: 50, max: 70 },
    'Roofer': { min: 45, avg: 60, max: 80 }
  },
  'TX-Dallas': {
    'General Contractor': { min: 58, avg: 78, max: 98 },
    'Carpenter': { min: 48, avg: 68, max: 88 },
    'Electrician': { min: 58, avg: 78, max: 98 },
    'Plumber': { min: 52, avg: 72, max: 92 },
    'HVAC Technician': { min: 52, avg: 68, max: 88 },
    'Painter': { min: 38, avg: 52, max: 68 },
    'Drywall Installer': { min: 42, avg: 58, max: 72 },
    'Flooring Installer': { min: 38, avg: 52, max: 72 },
    'Roofer': { min: 48, avg: 62, max: 82 }
  },
  'TX-Austin': {
    'General Contractor': { min: 60, avg: 80, max: 100 },
    'Carpenter': { min: 50, avg: 70, max: 90 },
    'Electrician': { min: 60, avg: 80, max: 100 },
    'Plumber': { min: 55, avg: 75, max: 95 },
    'HVAC Technician': { min: 55, avg: 70, max: 90 },
    'Painter': { min: 40, avg: 55, max: 70 },
    'Drywall Installer': { min: 45, avg: 60, max: 75 },
    'Flooring Installer': { min: 40, avg: 55, max: 75 },
    'Roofer': { min: 50, avg: 65, max: 85 }
  },
  
  // New York
  'NY-New York City': {
    'General Contractor': { min: 90, avg: 115, max: 150 },
    'Carpenter': { min: 80, avg: 100, max: 130 },
    'Electrician': { min: 90, avg: 115, max: 145 },
    'Plumber': { min: 85, avg: 110, max: 140 },
    'HVAC Technician': { min: 80, avg: 100, max: 130 },
    'Painter': { min: 60, avg: 80, max: 100 },
    'Drywall Installer': { min: 65, avg: 85, max: 110 },
    'Flooring Installer': { min: 60, avg: 80, max: 105 },
    'Roofer': { min: 70, avg: 90, max: 115 }
  },
  
  // Illinois
  'IL-Chicago': {
    'General Contractor': { min: 65, avg: 85, max: 110 },
    'Carpenter': { min: 55, avg: 75, max: 95 },
    'Electrician': { min: 65, avg: 85, max: 110 },
    'Plumber': { min: 60, avg: 80, max: 105 },
    'HVAC Technician': { min: 55, avg: 75, max: 95 },
    'Painter': { min: 40, avg: 60, max: 75 },
    'Drywall Installer': { min: 45, avg: 65, max: 85 },
    'Flooring Installer': { min: 40, avg: 60, max: 80 },
    'Roofer': { min: 50, avg: 70, max: 90 }
  },
  
  // Florida
  'FL-Miami': {
    'General Contractor': { min: 60, avg: 80, max: 105 },
    'Carpenter': { min: 50, avg: 70, max: 90 },
    'Electrician': { min: 60, avg: 80, max: 105 },
    'Plumber': { min: 55, avg: 75, max: 100 },
    'HVAC Technician': { min: 55, avg: 70, max: 90 },
    'Painter': { min: 40, avg: 55, max: 70 },
    'Drywall Installer': { min: 45, avg: 60, max: 75 },
    'Flooring Installer': { min: 40, avg: 55, max: 75 },
    'Roofer': { min: 50, avg: 65, max: 85 }
  },
  'FL-Orlando': {
    'General Contractor': { min: 55, avg: 75, max: 95 },
    'Carpenter': { min: 45, avg: 65, max: 85 },
    'Electrician': { min: 55, avg: 75, max: 95 },
    'Plumber': { min: 50, avg: 70, max: 90 },
    'HVAC Technician': { min: 50, avg: 65, max: 85 },
    'Painter': { min: 35, avg: 50, max: 65 },
    'Drywall Installer': { min: 40, avg: 55, max: 70 },
    'Flooring Installer': { min: 35, avg: 50, max: 70 },
    'Roofer': { min: 45, avg: 60, max: 80 }
  },
  
  // Washington
  'WA-Seattle': {
    'General Contractor': { min: 75, avg: 100, max: 130 },
    'Carpenter': { min: 65, avg: 85, max: 115 },
    'Electrician': { min: 75, avg: 100, max: 130 },
    'Plumber': { min: 70, avg: 95, max: 125 },
    'HVAC Technician': { min: 65, avg: 85, max: 115 },
    'Painter': { min: 50, avg: 70, max: 90 },
    'Drywall Installer': { min: 55, avg: 75, max: 100 },
    'Flooring Installer': { min: 50, avg: 70, max: 95 },
    'Roofer': { min: 60, avg: 80, max: 105 }
  },
  
  // Colorado
  'CO-Denver': {
    'General Contractor': { min: 62, avg: 82, max: 107 },
    'Carpenter': { min: 52, avg: 72, max: 92 },
    'Electrician': { min: 62, avg: 82, max: 107 },
    'Plumber': { min: 58, avg: 78, max: 103 },
    'HVAC Technician': { min: 55, avg: 72, max: 92 },
    'Painter': { min: 42, avg: 58, max: 73 },
    'Drywall Installer': { min: 48, avg: 63, max: 83 },
    'Flooring Installer': { min: 42, avg: 58, max: 78 },
    'Roofer': { min: 52, avg: 68, max: 88 }
  },
  
  // Arizona
  'AZ-Phoenix': {
    'General Contractor': { min: 55, avg: 75, max: 95 },
    'Carpenter': { min: 45, avg: 65, max: 85 },
    'Electrician': { min: 55, avg: 75, max: 95 },
    'Plumber': { min: 50, avg: 70, max: 90 },
    'HVAC Technician': { min: 50, avg: 65, max: 85 },
    'Painter': { min: 35, avg: 50, max: 65 },
    'Drywall Installer': { min: 40, avg: 55, max: 70 },
    'Flooring Installer': { min: 35, avg: 50, max: 70 },
    'Roofer': { min: 45, avg: 60, max: 80 }
  },
  
  // Georgia
  'GA-Atlanta': {
    'General Contractor': { min: 58, avg: 78, max: 100 },
    'Carpenter': { min: 48, avg: 68, max: 88 },
    'Electrician': { min: 58, avg: 78, max: 100 },
    'Plumber': { min: 52, avg: 72, max: 95 },
    'HVAC Technician': { min: 52, avg: 68, max: 88 },
    'Painter': { min: 38, avg: 53, max: 68 },
    'Drywall Installer': { min: 42, avg: 58, max: 73 },
    'Flooring Installer': { min: 38, avg: 53, max: 73 },
    'Roofer': { min: 48, avg: 63, max: 83 }
  },
  
  // Massachusetts
  'MA-Boston': {
    'General Contractor': { min: 80, avg: 105, max: 135 },
    'Carpenter': { min: 70, avg: 90, max: 120 },
    'Electrician': { min: 80, avg: 105, max: 135 },
    'Plumber': { min: 75, avg: 100, max: 130 },
    'HVAC Technician': { min: 70, avg: 90, max: 120 },
    'Painter': { min: 55, avg: 75, max: 95 },
    'Drywall Installer': { min: 60, avg: 80, max: 105 },
    'Flooring Installer': { min: 55, avg: 75, max: 100 },
    'Roofer': { min: 65, avg: 85, max: 110 }
  },
  
  // Oregon
  'OR-Portland': {
    'General Contractor': { min: 68, avg: 90, max: 118 },
    'Carpenter': { min: 58, avg: 78, max: 103 },
    'Electrician': { min: 68, avg: 90, max: 118 },
    'Plumber': { min: 63, avg: 85, max: 113 },
    'HVAC Technician': { min: 60, avg: 78, max: 103 },
    'Painter': { min: 45, avg: 63, max: 83 },
    'Drywall Installer': { min: 50, avg: 68, max: 90 },
    'Flooring Installer': { min: 45, avg: 63, max: 88 },
    'Roofer': { min: 55, avg: 73, max: 95 }
  },
  
  // North Carolina
  'NC-Charlotte': {
    'General Contractor': { min: 54, avg: 72, max: 92 },
    'Carpenter': { min: 44, avg: 62, max: 80 },
    'Electrician': { min: 54, avg: 72, max: 92 },
    'Plumber': { min: 48, avg: 67, max: 87 },
    'HVAC Technician': { min: 48, avg: 62, max: 80 },
    'Painter': { min: 34, avg: 48, max: 62 },
    'Drywall Installer': { min: 38, avg: 53, max: 67 },
    'Flooring Installer': { min: 34, avg: 48, max: 67 },
    'Roofer': { min: 44, avg: 58, max: 77 }
  },
  
  // Tennessee
  'TN-Nashville': {
    'General Contractor': { min: 52, avg: 70, max: 88 },
    'Carpenter': { min: 42, avg: 60, max: 78 },
    'Electrician': { min: 52, avg: 70, max: 88 },
    'Plumber': { min: 47, avg: 65, max: 83 },
    'HVAC Technician': { min: 47, avg: 60, max: 78 },
    'Painter': { min: 32, avg: 47, max: 60 },
    'Drywall Installer': { min: 37, avg: 50, max: 65 },
    'Flooring Installer': { min: 32, avg: 47, max: 65 },
    'Roofer': { min: 42, avg: 56, max: 73 }
  },
  
  // Default/National Average
  'DEFAULT': {
    'General Contractor': { min: 60, avg: 80, max: 105 },
    'Carpenter': { min: 50, avg: 70, max: 90 },
    'Electrician': { min: 60, avg: 80, max: 105 },
    'Plumber': { min: 55, avg: 75, max: 100 },
    'HVAC Technician': { min: 55, avg: 70, max: 90 },
    'Painter': { min: 40, avg: 55, max: 70 },
    'Drywall Installer': { min: 45, avg: 60, max: 75 },
    'Flooring Installer': { min: 40, avg: 55, max: 75 },
    'Roofer': { min: 50, avg: 65, max: 85 }
  }
};

// ============================================================================
// LABOR DETECTION
// ============================================================================

/**
 * Detect if line item is labor
 */
function detectLaborItem(lineItem) {
  const desc = (lineItem.description || '').toLowerCase();
  const unit = (lineItem.unit || '').toUpperCase();
  
  // Check unit first (most reliable)
  if (unit === 'HR' || unit === 'HOUR' || unit === 'DAY') {
    return true;
  }
  
  // Labor keywords
  if (desc.match(/\blabor\b|\binstall\b|\binstallation\b|\bservice\b|\bwork\b/i)) {
    return true;
  }
  
  // Specific labor phrases
  if (desc.match(/labor only|installation labor|service call|hourly rate/i)) {
    return true;
  }
  
  return false;
}

/**
 * Identify trade from line item
 */
function identifyTrade(lineItem) {
  const desc = (lineItem.description || '').toLowerCase();
  const category = (lineItem.category || '').toLowerCase();
  
  // Check category first
  if (category.includes('electric')) return 'Electrician';
  if (category.includes('plumb')) return 'Plumber';
  if (category.includes('hvac')) return 'HVAC Technician';
  if (category.includes('paint')) return 'Painter';
  if (category.includes('drywall')) return 'Drywall Installer';
  if (category.includes('floor')) return 'Flooring Installer';
  if (category.includes('roof')) return 'Roofer';
  if (category.includes('fram') || category.includes('carpenter')) return 'Carpenter';
  
  // Check description
  if (desc.match(/electric|wiring|outlet|switch|circuit|breaker/i)) return 'Electrician';
  if (desc.match(/plumb|pipe|drain|water line|fixture|faucet|toilet/i)) return 'Plumber';
  if (desc.match(/hvac|heating|cooling|air condition|furnace|duct/i)) return 'HVAC Technician';
  if (desc.match(/paint|primer|finish coat/i)) return 'Painter';
  if (desc.match(/drywall|sheetrock|gypsum/i)) return 'Drywall Installer';
  if (desc.match(/floor|carpet|tile|hardwood|vinyl|laminate/i)) return 'Flooring Installer';
  if (desc.match(/roof|shingle|membrane/i)) return 'Roofer';
  if (desc.match(/fram|carpenter|stud|joist/i)) return 'Carpenter';
  
  return 'General Contractor';
}

/**
 * Calculate hourly rate from line item
 */
function calculateHourlyRate(lineItem) {
  const unit = (lineItem.unit || '').toUpperCase();
  const unitPrice = lineItem.unit_price || lineItem.unitPrice || 0;
  const total = lineItem.total || 0;
  const quantity = lineItem.quantity || 0;
  
  // Direct hourly rate
  if (unit === 'HR' || unit === 'HOUR') {
    return unitPrice;
  }
  
  // Daily rate (assume 8-hour day)
  if (unit === 'DAY') {
    return unitPrice / 8;
  }
  
  // Try to extract from total and quantity
  if (quantity > 0 && total > 0) {
    const calculatedRate = total / quantity;
    
    // If calculated rate is reasonable for hourly (20-200), use it
    if (calculatedRate >= 20 && calculatedRate <= 200) {
      return calculatedRate;
    }
  }
  
  return 0;
}

/**
 * Look up labor rate for trade and region
 */
async function lookupLaborRate(trade, region) {
  // Try database first (future implementation)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('labor_rates')
        .select('*')
        .eq('trade', trade)
        .eq('region', region)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        return {
          min: data.min_rate,
          avg: data.avg_rate,
          max: data.max_rate
        };
      }
    } catch (error) {
      console.warn('Database lookup failed, using hardcoded rates:', error.message);
    }
  }
  
  // Fallback to hardcoded rates
  const regionRates = LABOR_RATES[region] || LABOR_RATES['DEFAULT'];
  return regionRates[trade] || null;
}

/**
 * Calculate labor score (0-100)
 */
function calculateLaborScore(undervalued, overvalued, totalVariance) {
  let score = 100;
  
  // Penalize undervalued labor (more severe)
  score -= undervalued.length * 10;
  
  // Penalize overvalued labor (less severe)
  score -= overvalued.length * 5;
  
  // Penalize based on total variance magnitude
  if (Math.abs(totalVariance) > 5000) {
    score -= 15;
  } else if (Math.abs(totalVariance) > 2000) {
    score -= 10;
  } else if (Math.abs(totalVariance) > 1000) {
    score -= 5;
  }
  
  return Math.max(0, score);
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate labor rates
 * @param {object} params - Input parameters
 * @returns {object} Labor validation results
 */
async function validateLaborRates(params) {
  const {
    lineItems = [],
    region = 'DEFAULT',
    metadata = {}
  } = params;
  
  if (lineItems.length === 0) {
    return {
      success: false,
      error: 'No line items provided'
    };
  }
  
  const undervaluedLabor = [];
  const overvaluedLabor = [];
  const validatedItems = [];
  let totalLaborCost = 0;
  let totalLaborVariance = 0;
  
  for (const item of lineItems) {
    // Detect if line item is labor
    const isLabor = detectLaborItem(item);
    if (!isLabor) continue;
    
    const itemTotal = item.total || 0;
    totalLaborCost += itemTotal;
    
    // Identify trade
    const trade = identifyTrade(item);
    
    // Look up market rates
    const marketRates = await lookupLaborRate(trade, region);
    if (!marketRates) {
      validatedItems.push({
        lineNumber: item.line_number || item.lineNumber,
        description: item.description,
        trade,
        validated: false,
        reason: 'No market data available for this trade'
      });
      continue;
    }
    
    // Calculate hourly rate from item
    const estimateRate = calculateHourlyRate(item);
    if (estimateRate === 0) {
      validatedItems.push({
        lineNumber: item.line_number || item.lineNumber,
        description: item.description,
        trade,
        validated: false,
        reason: 'Unable to calculate hourly rate'
      });
      continue;
    }
    
    // Calculate variance
    const variance = estimateRate - marketRates.avg;
    const variancePercentage = (variance / marketRates.avg) * 100;
    const quantity = item.quantity || 1;
    
    totalLaborVariance += variance * quantity;
    
    // Flag if >20% below market (underpayment)
    if (variancePercentage < -20) {
      undervaluedLabor.push({
        lineNumber: item.line_number || item.lineNumber,
        description: item.description,
        trade,
        estimateRate: parseFloat(estimateRate.toFixed(2)),
        marketRate: marketRates,
        variance: parseFloat(variance.toFixed(2)),
        variancePercentage: parseFloat(variancePercentage.toFixed(2)),
        severity: variancePercentage < -40 ? 'CRITICAL' : 'HIGH',
        issue: `Labor rate ${Math.abs(variancePercentage).toFixed(1)}% below market average`,
        impact: parseFloat((Math.abs(variance) * quantity).toFixed(2)),
        recommendation: `Verify labor rate. Market average for ${trade} in ${region} is $${marketRates.avg}/hr (range: $${marketRates.min}-$${marketRates.max})`
      });
    }
    
    // Flag if >30% above market (potential overcharge)
    else if (variancePercentage > 30) {
      overvaluedLabor.push({
        lineNumber: item.line_number || item.lineNumber,
        description: item.description,
        trade,
        estimateRate: parseFloat(estimateRate.toFixed(2)),
        marketRate: marketRates,
        variance: parseFloat(variance.toFixed(2)),
        variancePercentage: parseFloat(variancePercentage.toFixed(2)),
        severity: variancePercentage > 50 ? 'CRITICAL' : 'MODERATE',
        issue: `Labor rate ${variancePercentage.toFixed(1)}% above market average`,
        impact: parseFloat((variance * quantity).toFixed(2)),
        recommendation: `Verify labor rate. Market average for ${trade} in ${region} is $${marketRates.avg}/hr (range: $${marketRates.min}-$${marketRates.max})`
      });
    }
    
    // Track validated items
    else {
      validatedItems.push({
        lineNumber: item.line_number || item.lineNumber,
        description: item.description,
        trade,
        estimateRate: parseFloat(estimateRate.toFixed(2)),
        marketRate: marketRates,
        variance: parseFloat(variance.toFixed(2)),
        variancePercentage: parseFloat(variancePercentage.toFixed(2)),
        validated: true,
        status: 'Within market range'
      });
    }
  }
  
  // Calculate labor score (0-100)
  const laborScore = calculateLaborScore(
    undervaluedLabor,
    overvaluedLabor,
    totalLaborVariance
  );
  
  return {
    success: true,
    totalLaborCost: parseFloat(totalLaborCost.toFixed(2)),
    laborVariance: parseFloat(totalLaborVariance.toFixed(2)),
    undervaluedLabor,
    overvaluedLabor,
    validatedItems,
    laborScore: parseFloat(laborScore.toFixed(2)),
    region,
    summary: {
      total_labor_items: undervaluedLabor.length + overvaluedLabor.length + validatedItems.length,
      undervalued_count: undervaluedLabor.length,
      overvalued_count: overvaluedLabor.length,
      validated_count: validatedItems.length,
      total_impact: parseFloat((
        undervaluedLabor.reduce((sum, item) => sum + item.impact, 0) +
        overvaluedLabor.reduce((sum, item) => sum + item.impact, 0)
      ).toFixed(2))
    },
    metadata: {
      engine_version: '1.0',
      calculation_method: 'deterministic',
      regions_available: Object.keys(LABOR_RATES).length,
      trades_available: Object.keys(LABOR_RATES['DEFAULT']).length
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  validateLaborRates,
  detectLaborItem,
  identifyTrade,
  calculateHourlyRate,
  lookupLaborRate,
  calculateLaborScore,
  LABOR_RATES
};

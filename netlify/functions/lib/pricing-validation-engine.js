/**
 * Pricing Validation Engine
 * Validates line-item pricing against market data sources
 * Detects pricing manipulation and provides market-rate comparisons
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Market pricing database (expandable with real data sources)
 * In production, this would integrate with Xactimate API, RSMeans, or local market data
 */
const MARKET_PRICING = {
  // Roofing (per SQ - 100 SF)
  'asphalt_shingles_install': { min: 300, max: 500, avg: 400, unit: 'SQ' },
  'asphalt_shingles_material': { min: 80, max: 150, avg: 115, unit: 'SQ' },
  'tear_off_shingles': { min: 50, max: 100, avg: 75, unit: 'SQ' },
  'ridge_vent_install': { min: 10, max: 20, avg: 15, unit: 'LF' },
  'drip_edge': { min: 2, max: 5, avg: 3.5, unit: 'LF' },
  'ice_water_shield': { min: 3, max: 6, avg: 4.5, unit: 'SF' },
  
  // Siding (per SF)
  'vinyl_siding_install': { min: 4, max: 8, avg: 6, unit: 'SF' },
  'fiber_cement_siding': { min: 8, max: 15, avg: 11.5, unit: 'SF' },
  'wood_siding': { min: 6, max: 12, avg: 9, unit: 'SF' },
  
  // Drywall (per SF)
  'drywall_removal': { min: 0.5, max: 2, avg: 1.25, unit: 'SF' },
  'drywall_install': { min: 2, max: 4, avg: 3, unit: 'SF' },
  'drywall_finish': { min: 1, max: 3, avg: 2, unit: 'SF' },
  'texture_ceiling': { min: 0.75, max: 2, avg: 1.5, unit: 'SF' },
  
  // Flooring (per SF)
  'carpet_install': { min: 3, max: 8, avg: 5.5, unit: 'SF' },
  'hardwood_install': { min: 8, max: 15, avg: 11.5, unit: 'SF' },
  'tile_install': { min: 10, max: 20, avg: 15, unit: 'SF' },
  'vinyl_plank_install': { min: 5, max: 10, avg: 7.5, unit: 'SF' },
  
  // Labor rates (per hour)
  'general_labor': { min: 35, max: 65, avg: 50, unit: 'HR' },
  'skilled_labor': { min: 50, max: 90, avg: 70, unit: 'HR' },
  'master_tradesman': { min: 75, max: 125, avg: 100, unit: 'HR' },
  
  // Painting (per SF)
  'interior_paint': { min: 1.5, max: 4, avg: 2.75, unit: 'SF' },
  'exterior_paint': { min: 2, max: 5, avg: 3.5, unit: 'SF' },
  
  // Plumbing
  'water_heater_install': { min: 800, max: 1500, avg: 1150, unit: 'EA' },
  'toilet_install': { min: 200, max: 400, avg: 300, unit: 'EA' },
  'sink_install': { min: 250, max: 500, avg: 375, unit: 'EA' },
  
  // Electrical
  'outlet_install': { min: 75, max: 150, avg: 112.5, unit: 'EA' },
  'light_fixture_install': { min: 100, max: 250, avg: 175, unit: 'EA' },
  'circuit_breaker': { min: 150, max: 300, avg: 225, unit: 'EA' },
  
  // HVAC
  'hvac_unit_install': { min: 3000, max: 8000, avg: 5500, unit: 'EA' },
  'ductwork': { min: 15, max: 35, avg: 25, unit: 'LF' },
  
  // Windows/Doors
  'window_install': { min: 300, max: 800, avg: 550, unit: 'EA' },
  'door_install': { min: 400, max: 1200, avg: 800, unit: 'EA' },
  'garage_door': { min: 800, max: 2000, avg: 1400, unit: 'EA' }
};

/**
 * Geographic adjustment factors by state
 */
const GEO_ADJUSTMENTS = {
  'CA': 1.25, 'NY': 1.20, 'MA': 1.18, 'WA': 1.15, 'CO': 1.12,
  'FL': 1.10, 'TX': 1.05, 'IL': 1.08, 'NJ': 1.15, 'CT': 1.15,
  'AZ': 0.95, 'NM': 0.90, 'MS': 0.85, 'AL': 0.88, 'AR': 0.87,
  'DEFAULT': 1.0
};

/**
 * Normalize description for market pricing lookup
 */
function normalizeForPricing(description) {
  const normalized = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, '_')
    .trim();
  
  // Map common variations to standard keys
  const mappings = {
    'shingle_installation': 'asphalt_shingles_install',
    'install_shingles': 'asphalt_shingles_install',
    'shingles': 'asphalt_shingles_material',
    'tear_off': 'tear_off_shingles',
    'remove_shingles': 'tear_off_shingles',
    'vinyl_siding': 'vinyl_siding_install',
    'drywall_replacement': 'drywall_install',
    'sheetrock': 'drywall_install',
    'carpet': 'carpet_install',
    'hardwood_flooring': 'hardwood_install',
    'tile_flooring': 'tile_install',
    'paint_interior': 'interior_paint',
    'paint_exterior': 'exterior_paint'
  };
  
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return normalized;
}

/**
 * Validate pricing for a single line item
 */
function validateLineItemPricing(lineItem, state = null) {
  const normalized = normalizeForPricing(lineItem.description);
  const marketData = MARKET_PRICING[normalized];
  
  if (!marketData) {
    return {
      validated: false,
      reason: 'no_market_data',
      message: 'No market pricing data available for this item'
    };
  }
  
  // Check unit compatibility
  if (marketData.unit !== lineItem.unit) {
    return {
      validated: false,
      reason: 'unit_mismatch',
      message: `Market data is in ${marketData.unit}, line item is in ${lineItem.unit}`
    };
  }
  
  // Apply geographic adjustment
  const geoFactor = state ? (GEO_ADJUSTMENTS[state] || GEO_ADJUSTMENTS.DEFAULT) : 1.0;
  const adjustedMin = marketData.min * geoFactor;
  const adjustedMax = marketData.max * geoFactor;
  const adjustedAvg = marketData.avg * geoFactor;
  
  const unitPrice = lineItem.unit_price;
  const deviation = ((unitPrice - adjustedAvg) / adjustedAvg) * 100;
  
  // Determine pricing status
  let status = 'fair';
  let severity = 'none';
  let message = '';
  
  if (unitPrice < adjustedMin * 0.7) {
    status = 'severely_low';
    severity = 'critical';
    message = `Price is ${Math.abs(deviation).toFixed(1)}% below market average. Possible underpayment.`;
  } else if (unitPrice < adjustedMin) {
    status = 'below_market';
    severity = 'high';
    message = `Price is ${Math.abs(deviation).toFixed(1)}% below market range. Review for adequacy.`;
  } else if (unitPrice > adjustedMax * 1.3) {
    status = 'severely_high';
    severity = 'warning';
    message = `Price is ${deviation.toFixed(1)}% above market average. May be challenged by carrier.`;
  } else if (unitPrice > adjustedMax) {
    status = 'above_market';
    severity = 'low';
    message = `Price is ${deviation.toFixed(1)}% above market range. Within acceptable variance.`;
  } else {
    message = `Price is within market range (${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)}% from average).`;
  }
  
  return {
    validated: true,
    status,
    severity,
    message,
    market_data: {
      min: adjustedMin,
      max: adjustedMax,
      avg: adjustedAvg,
      unit: marketData.unit,
      geo_adjustment: geoFactor,
      state: state || 'DEFAULT'
    },
    pricing: {
      unit_price: unitPrice,
      deviation_percent: deviation,
      deviation_amount: unitPrice - adjustedAvg
    }
  };
}

/**
 * Validate all line items in an estimate
 */
function validateEstimatePricing(lineItems, state = null) {
  const results = [];
  const summary = {
    total_items: lineItems.length,
    validated_items: 0,
    severely_low: 0,
    below_market: 0,
    fair: 0,
    above_market: 0,
    severely_high: 0,
    no_market_data: 0,
    total_underpayment_risk: 0,
    critical_items: []
  };
  
  for (const item of lineItems) {
    const validation = validateLineItemPricing(item, state);
    
    if (validation.validated) {
      summary.validated_items++;
      summary[validation.status]++;
      
      if (validation.severity === 'critical') {
        summary.critical_items.push({
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total: item.total,
          market_avg: validation.market_data.avg,
          deviation_percent: validation.pricing.deviation_percent,
          potential_underpayment: (validation.market_data.avg - item.unit_price) * item.quantity
        });
        
        summary.total_underpayment_risk += (validation.market_data.avg - item.unit_price) * item.quantity;
      }
    } else {
      summary.no_market_data++;
    }
    
    results.push({
      line_item_id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total: item.total,
      validation
    });
  }
  
  return {
    results,
    summary
  };
}

/**
 * Compare contractor vs carrier pricing
 */
function comparePricing(contractorItems, carrierItems, matchedPairs, state = null) {
  const pricingIssues = [];
  
  for (const pair of matchedPairs) {
    const contractorItem = contractorItems.find(i => i.id === pair.contractor_line_id);
    const carrierItem = carrierItems.find(i => i.id === pair.carrier_line_id);
    
    if (!contractorItem || !carrierItem) continue;
    
    const contractorValidation = validateLineItemPricing(contractorItem, state);
    const carrierValidation = validateLineItemPricing(carrierItem, state);
    
    if (!contractorValidation.validated || !carrierValidation.validated) continue;
    
    // Check if carrier is suppressing pricing below market
    if (carrierValidation.severity === 'critical' && contractorValidation.status === 'fair') {
      pricingIssues.push({
        type: 'carrier_suppression',
        severity: 'critical',
        description: contractorItem.description,
        contractor_price: contractorItem.unit_price,
        carrier_price: carrierItem.unit_price,
        market_avg: contractorValidation.market_data.avg,
        carrier_deviation: carrierValidation.pricing.deviation_percent,
        potential_recovery: (contractorValidation.market_data.avg - carrierItem.unit_price) * carrierItem.quantity,
        message: `Carrier pricing is ${Math.abs(carrierValidation.pricing.deviation_percent).toFixed(1)}% below market. Contractor pricing is fair.`
      });
    }
    
    // Check if both are below market
    if (contractorValidation.severity === 'high' && carrierValidation.severity === 'critical') {
      pricingIssues.push({
        type: 'both_below_market',
        severity: 'high',
        description: contractorItem.description,
        contractor_price: contractorItem.unit_price,
        carrier_price: carrierItem.unit_price,
        market_avg: contractorValidation.market_data.avg,
        potential_recovery: (contractorValidation.market_data.avg - carrierItem.unit_price) * carrierItem.quantity,
        message: `Both estimates are below market. Consider obtaining additional estimate at market rates.`
      });
    }
  }
  
  return pricingIssues;
}

/**
 * AI-powered pricing validation for items without market data
 */
async function aiPricingValidation(lineItems, state = null) {
  const itemsNeedingValidation = lineItems.filter(item => {
    const normalized = normalizeForPricing(item.description);
    return !MARKET_PRICING[normalized];
  });
  
  if (itemsNeedingValidation.length === 0) {
    return [];
  }
  
  // Limit to top 20 items by dollar amount
  const topItems = itemsNeedingValidation
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
  
  const prompt = `You are a construction pricing expert. Validate the following line items against typical market rates for ${state || 'the United States'}.

For each item, provide:
1. Whether the pricing is fair, below market, or above market
2. Typical market range for this item
3. Any red flags or concerns

Line Items:
${topItems.map((item, idx) => `${idx + 1}. ${item.description} - ${item.quantity} ${item.unit} @ $${item.unit_price}/${item.unit} = $${item.total}`).join('\n')}

Return JSON array with format:
[
  {
    "line_number": 1,
    "status": "fair" | "below_market" | "above_market" | "severely_low",
    "severity": "none" | "low" | "high" | "critical",
    "market_min": number,
    "market_max": number,
    "market_avg": number,
    "deviation_percent": number,
    "message": "explanation",
    "red_flags": ["flag1", "flag2"]
  }
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a construction pricing expert specializing in insurance claim estimates.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const response = JSON.parse(completion.choices[0].message.content);
    const validations = response.validations || [];
    
    return topItems.map((item, idx) => {
      const validation = validations[idx] || {};
      return {
        line_item_id: item.id,
        description: item.description,
        ai_validation: validation,
        ai_confidence: 0.75,
        ai_model: 'gpt-4-turbo-preview'
      };
    });
  } catch (error) {
    console.error('AI pricing validation error:', error);
    return [];
  }
}

/**
 * Generate pricing validation report
 */
function generatePricingReport(contractorValidation, carrierValidation, pricingIssues) {
  const report = {
    contractor_summary: contractorValidation.summary,
    carrier_summary: carrierValidation.summary,
    pricing_issues: pricingIssues,
    overall_assessment: {
      contractor_pricing_quality: 'unknown',
      carrier_pricing_quality: 'unknown',
      total_pricing_risk: 0,
      recommendations: []
    }
  };
  
  // Assess contractor pricing quality
  const contractorFairPercent = (contractorValidation.summary.fair / contractorValidation.summary.validated_items) * 100;
  if (contractorFairPercent >= 80) {
    report.overall_assessment.contractor_pricing_quality = 'excellent';
  } else if (contractorFairPercent >= 60) {
    report.overall_assessment.contractor_pricing_quality = 'good';
  } else if (contractorFairPercent >= 40) {
    report.overall_assessment.contractor_pricing_quality = 'fair';
  } else {
    report.overall_assessment.contractor_pricing_quality = 'poor';
  }
  
  // Assess carrier pricing quality
  const carrierFairPercent = (carrierValidation.summary.fair / carrierValidation.summary.validated_items) * 100;
  if (carrierFairPercent >= 80) {
    report.overall_assessment.carrier_pricing_quality = 'excellent';
  } else if (carrierFairPercent >= 60) {
    report.overall_assessment.carrier_pricing_quality = 'good';
  } else if (carrierFairPercent >= 40) {
    report.overall_assessment.carrier_pricing_quality = 'fair';
  } else {
    report.overall_assessment.carrier_pricing_quality = 'poor';
  }
  
  // Calculate total pricing risk
  report.overall_assessment.total_pricing_risk = 
    carrierValidation.summary.total_underpayment_risk +
    pricingIssues.reduce((sum, issue) => sum + (issue.potential_recovery || 0), 0);
  
  // Generate recommendations
  if (carrierValidation.summary.critical_items.length > 0) {
    report.overall_assessment.recommendations.push({
      priority: 'critical',
      category: 'pricing_suppression',
      title: 'Carrier Pricing Below Market Detected',
      description: `${carrierValidation.summary.critical_items.length} line items priced significantly below market rates`,
      action: 'Challenge carrier pricing with market rate documentation',
      estimated_recovery: carrierValidation.summary.total_underpayment_risk
    });
  }
  
  if (pricingIssues.filter(i => i.type === 'carrier_suppression').length > 0) {
    report.overall_assessment.recommendations.push({
      priority: 'high',
      category: 'pricing_validation',
      title: 'Request Pricing Justification',
      description: 'Carrier pricing deviates from contractor and market rates',
      action: 'Submit formal request for pricing methodology and supporting documentation',
      estimated_recovery: pricingIssues.reduce((sum, i) => sum + (i.potential_recovery || 0), 0)
    });
  }
  
  return report;
}

/**
 * Main pricing validation function
 */
async function validatePricing(contractorLineItems, carrierLineItems, matchedPairs, state = null) {
  console.log('[Pricing Validation] Starting pricing validation...');
  
  // Validate contractor pricing
  const contractorValidation = validateEstimatePricing(contractorLineItems, state);
  
  // Validate carrier pricing
  const carrierValidation = validateEstimatePricing(carrierLineItems, state);
  
  // Compare pricing between estimates
  const pricingIssues = comparePricing(contractorLineItems, carrierLineItems, matchedPairs, state);
  
  // AI validation for items without market data
  const contractorAIValidations = await aiPricingValidation(
    contractorLineItems.filter(item => {
      const normalized = normalizeForPricing(item.description);
      return !MARKET_PRICING[normalized];
    }),
    state
  );
  
  const carrierAIValidations = await aiPricingValidation(
    carrierLineItems.filter(item => {
      const normalized = normalizeForPricing(item.description);
      return !MARKET_PRICING[normalized];
    }),
    state
  );
  
  // Generate comprehensive report
  const report = generatePricingReport(contractorValidation, carrierValidation, pricingIssues);
  
  console.log(`[Pricing Validation] Complete. Critical items: ${carrierValidation.summary.critical_items.length}`);
  
  return {
    contractor_pricing: contractorValidation,
    carrier_pricing: carrierValidation,
    pricing_issues: pricingIssues,
    contractor_ai_validations: contractorAIValidations,
    carrier_ai_validations: carrierAIValidations,
    report
  };
}

module.exports = {
  validatePricing,
  validateLineItemPricing,
  validateEstimatePricing,
  comparePricing,
  aiPricingValidation,
  generatePricingReport,
  MARKET_PRICING,
  GEO_ADJUSTMENTS
};

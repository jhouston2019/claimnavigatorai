/**
 * LOSS EXPECTATION ENGINE
 * Deterministic loss type classification and expected trade analysis
 * 
 * Supports 5 loss types with severity-based expected trades:
 * - WATER (LEVEL_1, LEVEL_2, LEVEL_3, CATEGORY_3)
 * - FIRE (LIGHT, MODERATE, HEAVY)
 * - WIND (MINOR, MAJOR)
 * - HAIL (MINOR, MAJOR)
 * - COLLISION (MINOR, MAJOR)
 * 
 * NO AI - Pure rule-based logic
 */

// ============================================================================
// LOSS TYPE EXPECTATIONS
// ============================================================================

const WATER_EXPECTATIONS = {
  LEVEL_1: {
    // Surface water, <24 hours, minimal absorption
    name: 'Level 1 Water Damage (Surface)',
    description: 'Surface water affecting materials with minimal absorption (<24 hours)',
    REQUIRED: [
      { trade: 'DRY', probability: 0.95, description: 'Drying equipment and dehumidification' },
      { trade: 'CLN', probability: 0.90, description: 'Cleaning and sanitizing' },
    ],
    COMMON: [
      { trade: 'DEM', probability: 0.60, description: 'Demolition if materials wet' },
      { trade: 'FLR', probability: 0.50, description: 'Flooring if carpet affected' },
      { trade: 'PNT', probability: 0.40, description: 'Paint if walls affected' },
    ],
    UNLIKELY: [
      { trade: 'FRM', probability: 0.10, description: 'Framing rarely needed' },
      { trade: 'RFG', probability: 0.05, description: 'Roofing rarely affected' },
    ]
  },
  
  LEVEL_2: {
    // Significant absorption, >24 hours, structural materials affected
    name: 'Level 2 Water Damage (Significant)',
    description: 'Significant absorption affecting structural materials (>24 hours)',
    REQUIRED: [
      { trade: 'DEM', probability: 0.95, description: 'Demolition of wet materials' },
      { trade: 'DRY', probability: 1.00, description: 'Drywall replacement' },
      { trade: 'PNT', probability: 0.95, description: 'Paint after drywall' },
      { trade: 'FLR', probability: 0.90, description: 'Flooring replacement' },
    ],
    COMMON: [
      { trade: 'INS', probability: 0.80, description: 'Insulation if wet' },
      { trade: 'TRM', probability: 0.75, description: 'Trim replacement' },
      { trade: 'CAB', probability: 0.40, description: 'Cabinets if affected' },
      { trade: 'ELE', probability: 0.50, description: 'Electrical if affected' },
      { trade: 'PLM', probability: 0.60, description: 'Plumbing if source' },
    ],
    UNLIKELY: [
      { trade: 'FRM', probability: 0.30, description: 'Framing if severe' },
      { trade: 'RFG', probability: 0.10, description: 'Roofing if leak source' },
    ]
  },
  
  LEVEL_3: {
    // Deep saturation, structural impact, extensive damage
    name: 'Level 3 Water Damage (Severe)',
    description: 'Deep saturation with structural impact, extensive damage',
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Extensive demolition' },
      { trade: 'DRY', probability: 1.00, description: 'Complete drywall replacement' },
      { trade: 'PNT', probability: 1.00, description: 'Complete repainting' },
      { trade: 'FLR', probability: 1.00, description: 'Complete flooring replacement' },
      { trade: 'INS', probability: 0.95, description: 'Insulation replacement' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.60, description: 'Framing if structural damage' },
      { trade: 'ELE', probability: 0.70, description: 'Electrical if affected' },
      { trade: 'PLM', probability: 0.80, description: 'Plumbing if source' },
      { trade: 'CAB', probability: 0.70, description: 'Cabinet replacement' },
      { trade: 'CTR', probability: 0.60, description: 'Countertop replacement' },
      { trade: 'TRM', probability: 0.85, description: 'Trim replacement' },
      { trade: 'DOR', probability: 0.50, description: 'Door replacement if affected' },
    ],
    UNLIKELY: [
      { trade: 'RFG', probability: 0.20, description: 'Roofing if leak source' },
      { trade: 'SID', probability: 0.15, description: 'Siding if exterior water' },
    ]
  },
  
  CATEGORY_3: {
    // Contaminated water (sewage, flooding)
    name: 'Category 3 Water Damage (Contaminated)',
    description: 'Contaminated water (sewage, flooding) requiring complete removal',
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Complete demolition' },
      { trade: 'CLN', probability: 1.00, description: 'Biohazard cleaning' },
      { trade: 'DRY', probability: 1.00, description: 'All drywall replacement' },
      { trade: 'FLR', probability: 1.00, description: 'All flooring replacement' },
      { trade: 'INS', probability: 1.00, description: 'All insulation replacement' },
      { trade: 'PNT', probability: 1.00, description: 'Complete repainting' },
    ],
    COMMON: [
      { trade: 'CAB', probability: 0.90, description: 'Cabinet replacement' },
      { trade: 'TRM', probability: 0.95, description: 'All trim replacement' },
      { trade: 'DOR', probability: 0.70, description: 'Door replacement if affected' },
      { trade: 'ELE', probability: 0.80, description: 'Electrical replacement' },
      { trade: 'PLM', probability: 0.90, description: 'Plumbing replacement' },
      { trade: 'FRM', probability: 0.50, description: 'Framing if structural' },
    ],
    UNLIKELY: []
  }
};

const FIRE_EXPECTATIONS = {
  LIGHT: {
    // Smoke damage, no structural, cosmetic only
    name: 'Light Fire Damage (Smoke)',
    description: 'Smoke damage with no structural impact, cosmetic restoration',
    REQUIRED: [
      { trade: 'CLN', probability: 1.00, description: 'Smoke cleaning' },
      { trade: 'PNT', probability: 0.95, description: 'Repainting' },
    ],
    COMMON: [
      { trade: 'FLR', probability: 0.40, description: 'Flooring if smoke damaged' },
      { trade: 'CAB', probability: 0.30, description: 'Cabinet cleaning/refinish' },
      { trade: 'TRM', probability: 0.35, description: 'Trim cleaning/replacement' },
      { trade: 'DRY', probability: 0.25, description: 'Drywall if soot penetration' },
    ],
    UNLIKELY: [
      { trade: 'FRM', probability: 0.05, description: 'Framing rarely needed' },
      { trade: 'RFG', probability: 0.10, description: 'Roofing if fire penetrated' },
      { trade: 'ELE', probability: 0.15, description: 'Electrical rarely affected' },
    ]
  },
  
  MODERATE: {
    // Partial structural, localized fire, some charring
    name: 'Moderate Fire Damage (Partial Structural)',
    description: 'Partial structural damage with localized fire and charring',
    REQUIRED: [
      { trade: 'DEM', probability: 0.95, description: 'Demolition of burned materials' },
      { trade: 'CLN', probability: 1.00, description: 'Smoke & soot removal' },
      { trade: 'DRY', probability: 0.90, description: 'Drywall replacement' },
      { trade: 'PNT', probability: 0.95, description: 'Complete repainting' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.60, description: 'Framing if structural' },
      { trade: 'ELE', probability: 0.80, description: 'Electrical repair' },
      { trade: 'FLR', probability: 0.75, description: 'Flooring replacement' },
      { trade: 'CAB', probability: 0.60, description: 'Cabinet replacement' },
      { trade: 'RFG', probability: 0.40, description: 'Roofing if fire penetrated' },
      { trade: 'INS', probability: 0.70, description: 'Insulation replacement' },
      { trade: 'TRM', probability: 0.65, description: 'Trim replacement' },
    ],
    UNLIKELY: [
      { trade: 'PLM', probability: 0.20, description: 'Plumbing rarely affected' },
      { trade: 'HVA', probability: 0.25, description: 'HVAC if near fire' },
    ]
  },
  
  HEAVY: {
    // Extensive structural, major fire, complete restoration
    name: 'Heavy Fire Damage (Extensive Structural)',
    description: 'Extensive structural damage requiring complete restoration',
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Complete demolition' },
      { trade: 'CLN', probability: 1.00, description: 'Extensive cleaning' },
      { trade: 'FRM', probability: 0.95, description: 'Structural framing' },
      { trade: 'DRY', probability: 1.00, description: 'Complete drywall' },
      { trade: 'PNT', probability: 1.00, description: 'Complete painting' },
      { trade: 'FLR', probability: 1.00, description: 'Complete flooring' },
    ],
    COMMON: [
      { trade: 'RFG', probability: 0.90, description: 'Roofing replacement' },
      { trade: 'ELE', probability: 0.95, description: 'Complete electrical' },
      { trade: 'PLM', probability: 0.85, description: 'Plumbing replacement' },
      { trade: 'HVA', probability: 0.80, description: 'HVAC replacement' },
      { trade: 'CAB', probability: 0.95, description: 'All cabinets' },
      { trade: 'WIN', probability: 0.85, description: 'Window replacement' },
      { trade: 'DOR', probability: 0.90, description: 'Door replacement' },
      { trade: 'INS', probability: 0.95, description: 'Complete insulation' },
      { trade: 'TRM', probability: 0.95, description: 'All trim' },
    ],
    UNLIKELY: []
  }
};

const WIND_EXPECTATIONS = {
  MINOR: {
    // Shingles, gutters, minor exterior damage
    name: 'Minor Wind Damage (Exterior)',
    description: 'Minor exterior damage to shingles, gutters, and siding',
    REQUIRED: [
      { trade: 'RFG', probability: 0.95, description: 'Roofing repair' },
    ],
    COMMON: [
      { trade: 'GUT', probability: 0.70, description: 'Gutter repair' },
      { trade: 'SID', probability: 0.40, description: 'Siding if damaged' },
      { trade: 'WIN', probability: 0.30, description: 'Window if broken' },
      { trade: 'DEM', probability: 0.50, description: 'Demolition of damaged materials' },
    ],
    UNLIKELY: [
      { trade: 'FRM', probability: 0.10, description: 'Framing rarely needed' },
      { trade: 'DRY', probability: 0.15, description: 'Interior rarely affected' },
      { trade: 'ELE', probability: 0.05, description: 'Electrical rarely affected' },
    ]
  },
  
  MAJOR: {
    // Structural damage, extensive exterior, interior affected
    name: 'Major Wind Damage (Structural)',
    description: 'Structural damage with extensive exterior and interior impact',
    REQUIRED: [
      { trade: 'RFG', probability: 1.00, description: 'Complete roofing' },
      { trade: 'SID', probability: 0.85, description: 'Siding replacement' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.70, description: 'Structural framing' },
      { trade: 'WIN', probability: 0.80, description: 'Window replacement' },
      { trade: 'DOR', probability: 0.60, description: 'Door replacement' },
      { trade: 'GUT', probability: 0.90, description: 'Gutter replacement' },
      { trade: 'DRY', probability: 0.60, description: 'Interior drywall' },
      { trade: 'PNT', probability: 0.60, description: 'Interior painting' },
      { trade: 'DEM', probability: 0.85, description: 'Extensive demolition' },
      { trade: 'INS', probability: 0.70, description: 'Insulation replacement' },
    ],
    UNLIKELY: [
      { trade: 'PLM', probability: 0.10, description: 'Plumbing rarely affected' },
      { trade: 'ELE', probability: 0.20, description: 'Electrical if severe' },
    ]
  }
};

const HAIL_EXPECTATIONS = {
  MINOR: {
    // Cosmetic damage, shingles, gutters
    name: 'Minor Hail Damage (Cosmetic)',
    description: 'Cosmetic damage to shingles, gutters, and exterior surfaces',
    REQUIRED: [
      { trade: 'RFG', probability: 0.90, description: 'Roofing repair/replacement' },
    ],
    COMMON: [
      { trade: 'GUT', probability: 0.60, description: 'Gutter repair' },
      { trade: 'SID', probability: 0.40, description: 'Siding if dented' },
      { trade: 'WIN', probability: 0.30, description: 'Window if cracked' },
    ],
    UNLIKELY: [
      { trade: 'FRM', probability: 0.05, description: 'Framing rarely needed' },
      { trade: 'DRY', probability: 0.10, description: 'Interior rarely affected' },
    ]
  },
  
  MAJOR: {
    // Severe damage, penetration, structural impact
    name: 'Major Hail Damage (Severe)',
    description: 'Severe hail damage with penetration and structural impact',
    REQUIRED: [
      { trade: 'RFG', probability: 1.00, description: 'Complete roofing replacement' },
      { trade: 'SID', probability: 0.80, description: 'Siding replacement' },
    ],
    COMMON: [
      { trade: 'WIN', probability: 0.70, description: 'Window replacement' },
      { trade: 'GUT', probability: 0.85, description: 'Gutter replacement' },
      { trade: 'DEM', probability: 0.60, description: 'Demolition if penetration' },
      { trade: 'DRY', probability: 0.50, description: 'Interior drywall if penetration' },
      { trade: 'PNT', probability: 0.50, description: 'Interior painting if affected' },
      { trade: 'FRM', probability: 0.40, description: 'Framing if severe penetration' },
    ],
    UNLIKELY: [
      { trade: 'PLM', probability: 0.05, description: 'Plumbing rarely affected' },
      { trade: 'ELE', probability: 0.10, description: 'Electrical rarely affected' },
    ]
  }
};

const COLLISION_EXPECTATIONS = {
  MINOR: {
    // Single wall, localized damage
    name: 'Minor Collision Damage (Localized)',
    description: 'Localized damage to single wall or area',
    REQUIRED: [
      { trade: 'DEM', probability: 0.90, description: 'Demolition of damaged area' },
      { trade: 'DRY', probability: 0.95, description: 'Drywall repair' },
      { trade: 'PNT', probability: 0.90, description: 'Painting' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.50, description: 'Framing if structural' },
      { trade: 'INS', probability: 0.40, description: 'Insulation replacement' },
      { trade: 'TRM', probability: 0.60, description: 'Trim replacement' },
      { trade: 'FLR', probability: 0.30, description: 'Flooring if affected' },
    ],
    UNLIKELY: [
      { trade: 'RFG', probability: 0.10, description: 'Roofing rarely affected' },
      { trade: 'PLM', probability: 0.15, description: 'Plumbing if pipes damaged' },
      { trade: 'ELE', probability: 0.20, description: 'Electrical if wiring damaged' },
    ]
  },
  
  MAJOR: {
    // Multiple walls, structural damage, extensive impact
    name: 'Major Collision Damage (Structural)',
    description: 'Major structural damage affecting multiple walls and systems',
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Extensive demolition' },
      { trade: 'FRM', probability: 0.95, description: 'Structural framing' },
      { trade: 'DRY', probability: 1.00, description: 'Drywall replacement' },
      { trade: 'PNT', probability: 1.00, description: 'Complete painting' },
    ],
    COMMON: [
      { trade: 'WIN', probability: 0.70, description: 'Window replacement' },
      { trade: 'DOR', probability: 0.80, description: 'Door replacement' },
      { trade: 'INS', probability: 0.85, description: 'Insulation replacement' },
      { trade: 'TRM', probability: 0.80, description: 'Trim replacement' },
      { trade: 'FLR', probability: 0.60, description: 'Flooring replacement' },
      { trade: 'ELE', probability: 0.60, description: 'Electrical repair' },
      { trade: 'PLM', probability: 0.50, description: 'Plumbing repair' },
      { trade: 'SID', probability: 0.50, description: 'Exterior siding' },
    ],
    UNLIKELY: [
      { trade: 'RFG', probability: 0.20, description: 'Roofing if severe' },
      { trade: 'HVA', probability: 0.15, description: 'HVAC if impacted' },
    ]
  }
};

// ============================================================================
// TRADE CODE MAPPINGS
// ============================================================================

const TRADE_CODES = {
  'DEM': 'Demolition',
  'DRY': 'Drywall',
  'PNT': 'Painting',
  'FLR': 'Flooring',
  'CLN': 'Cleaning',
  'INS': 'Insulation',
  'TRM': 'Trim',
  'CAB': 'Cabinets',
  'CTR': 'Countertops',
  'FRM': 'Framing',
  'ELE': 'Electrical',
  'PLM': 'Plumbing',
  'RFG': 'Roofing',
  'SID': 'Siding',
  'WIN': 'Windows',
  'DOR': 'Doors',
  'GUT': 'Gutters',
  'HVA': 'HVAC'
};

// ============================================================================
// LOSS TYPE DETECTION
// ============================================================================

/**
 * Detect loss type from line items
 */
function detectLossType(lineItems) {
  const scores = {
    WATER: 0,
    FIRE: 0,
    WIND: 0,
    HAIL: 0,
    COLLISION: 0
  };
  
  for (const item of lineItems) {
    const desc = (item.description || '').toLowerCase();
    
    // Water keywords
    if (desc.match(/water|flood|leak|moisture|dry|dehumid|extract|wet|mold|mildew/i)) {
      scores.WATER += 2;
    }
    
    // Fire keywords
    if (desc.match(/fire|smoke|soot|burn|char|scorch|flame/i)) {
      scores.FIRE += 2;
    }
    
    // Wind keywords
    if (desc.match(/wind|storm|hurricane|tornado|blow|gust/i)) {
      scores.WIND += 2;
    }
    
    // Hail keywords
    if (desc.match(/hail|impact|dent|puncture/i)) {
      scores.HAIL += 2;
    }
    
    // Collision keywords
    if (desc.match(/collision|impact|vehicle|crash|hit/i)) {
      scores.COLLISION += 2;
    }
    
    // Trade-based inference
    const category = item.category || '';
    
    // Drying equipment = water
    if (desc.match(/drying|dehumidif|air mover|extraction/i)) {
      scores.WATER += 3;
    }
    
    // Cleaning = fire or water
    if (desc.match(/clean|sanitize|deodorize/i)) {
      scores.FIRE += 1;
      scores.WATER += 1;
    }
    
    // Roofing = wind or hail
    if (category === 'Roofing' || desc.match(/roof|shingle/i)) {
      scores.WIND += 1;
      scores.HAIL += 1;
    }
    
    // Structural framing = collision or wind
    if (desc.match(/framing|structural|beam|joist/i)) {
      scores.COLLISION += 1;
      scores.WIND += 1;
    }
  }
  
  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  
  if (maxScore === 0) {
    return { type: 'UNKNOWN', confidence: 0, scores };
  }
  
  const lossType = Object.keys(scores).find(key => scores[key] === maxScore);
  const confidence = maxScore / lineItems.length;
  
  return {
    type: lossType,
    confidence: Math.min(confidence, 1.0),
    scores
  };
}

/**
 * Infer severity from trade density and quantities
 */
function inferSeverity(lossType, lineItems, totalCost) {
  const tradeCount = new Set(lineItems.map(i => i.category)).size;
  const avgItemCost = totalCost / lineItems.length;
  
  // Water severity
  if (lossType === 'WATER') {
    const hasDrying = lineItems.some(i => 
      (i.description || '').match(/dry|dehumid|extract/i)
    );
    const hasDemolition = lineItems.some(i => 
      (i.description || '').match(/demo|remove|tear out/i)
    );
    const hasFraming = lineItems.some(i => 
      (i.description || '').match(/fram|structural/i)
    );
    const hasContamination = lineItems.some(i => 
      (i.description || '').match(/sewage|category 3|biohazard/i)
    );
    
    if (hasContamination) return 'CATEGORY_3';
    if (hasFraming || tradeCount >= 8) return 'LEVEL_3';
    if (hasDemolition && tradeCount >= 5) return 'LEVEL_2';
    return 'LEVEL_1';
  }
  
  // Fire severity
  if (lossType === 'FIRE') {
    const hasFraming = lineItems.some(i => 
      (i.description || '').match(/fram|structural/i)
    );
    const hasRoofing = lineItems.some(i => 
      (i.description || '').match(/roof/i)
    );
    
    if (hasFraming && tradeCount >= 8) return 'HEAVY';
    if (tradeCount >= 5 || hasRoofing) return 'MODERATE';
    return 'LIGHT';
  }
  
  // Wind severity
  if (lossType === 'WIND') {
    const hasFraming = lineItems.some(i => 
      (i.description || '').match(/fram|structural/i)
    );
    const hasInterior = lineItems.some(i => 
      (i.description || '').match(/drywall|paint|interior/i)
    );
    
    if (hasFraming || (hasInterior && tradeCount >= 6)) return 'MAJOR';
    return 'MINOR';
  }
  
  // Hail severity
  if (lossType === 'HAIL') {
    const hasPenetration = lineItems.some(i => 
      (i.description || '').match(/penetrat|interior|drywall/i)
    );
    
    if (hasPenetration || tradeCount >= 5) return 'MAJOR';
    return 'MINOR';
  }
  
  // Collision severity
  if (lossType === 'COLLISION') {
    const hasFraming = lineItems.some(i => 
      (i.description || '').match(/fram|structural/i)
    );
    
    if (hasFraming && tradeCount >= 6) return 'MAJOR';
    return 'MINOR';
  }
  
  return 'UNKNOWN';
}

/**
 * Get expected trades for loss type and severity
 */
function getExpectedTrades(lossType, severity) {
  const expectations = {
    WATER: WATER_EXPECTATIONS,
    FIRE: FIRE_EXPECTATIONS,
    WIND: WIND_EXPECTATIONS,
    HAIL: HAIL_EXPECTATIONS,
    COLLISION: COLLISION_EXPECTATIONS
  };
  
  const typeExpectations = expectations[lossType];
  if (!typeExpectations) return null;
  
  const severityExpectations = typeExpectations[severity];
  if (!severityExpectations) return null;
  
  return severityExpectations;
}

/**
 * Analyze missing critical trades
 */
function analyzeMissingTrades(lineItems, expectedTrades) {
  if (!expectedTrades) return [];
  
  const presentTrades = new Set();
  
  for (const item of lineItems) {
    const desc = (item.description || '').toLowerCase();
    const category = item.category || '';
    
    // Map description to trade codes
    for (const [code, name] of Object.entries(TRADE_CODES)) {
      if (desc.includes(name.toLowerCase()) || category === name) {
        presentTrades.add(code);
      }
    }
  }
  
  const missingCritical = [];
  
  // Check REQUIRED trades
  for (const trade of expectedTrades.REQUIRED || []) {
    if (!presentTrades.has(trade.trade)) {
      missingCritical.push({
        trade: trade.trade,
        tradeName: TRADE_CODES[trade.trade],
        probability: trade.probability,
        description: trade.description,
        severity: 'CRITICAL',
        impact: 'Required trade missing - estimate may be incomplete'
      });
    }
  }
  
  // Check COMMON trades with high probability
  for (const trade of expectedTrades.COMMON || []) {
    if (trade.probability >= 0.70 && !presentTrades.has(trade.trade)) {
      missingCritical.push({
        trade: trade.trade,
        tradeName: TRADE_CODES[trade.trade],
        probability: trade.probability,
        description: trade.description,
        severity: 'HIGH',
        impact: 'Highly probable trade missing - verify if applicable'
      });
    }
  }
  
  return missingCritical;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze loss expectation
 * @param {object} params - Input parameters
 * @returns {object} Loss expectation analysis
 */
function analyzeLossExpectation(params) {
  const {
    lineItems = [],
    totalCost = 0,
    metadata = {}
  } = params;
  
  if (lineItems.length === 0) {
    return {
      success: false,
      error: 'No line items provided'
    };
  }
  
  // Step 1: Detect loss type
  const lossDetection = detectLossType(lineItems);
  
  if (lossDetection.type === 'UNKNOWN') {
    return {
      success: false,
      error: 'Unable to determine loss type',
      lossDetection
    };
  }
  
  // Step 2: Infer severity
  const severity = inferSeverity(lossDetection.type, lineItems, totalCost);
  
  // Step 3: Get expected trades
  const expectedTrades = getExpectedTrades(lossDetection.type, severity);
  
  // Step 4: Analyze missing trades
  const missingTrades = analyzeMissingTrades(lineItems, expectedTrades);
  
  // Step 5: Calculate completeness score
  const totalExpected = (expectedTrades?.REQUIRED?.length || 0) + 
                        (expectedTrades?.COMMON?.length || 0);
  const completenessScore = totalExpected > 0 
    ? Math.max(0, 100 - (missingTrades.length / totalExpected * 100))
    : 100;
  
  return {
    success: true,
    lossType: lossDetection.type,
    severity,
    confidence: lossDetection.confidence,
    expectedTrades: {
      name: expectedTrades?.name || '',
      description: expectedTrades?.description || '',
      required: expectedTrades?.REQUIRED || [],
      common: expectedTrades?.COMMON || [],
      unlikely: expectedTrades?.UNLIKELY || []
    },
    missingTrades,
    completenessScore: parseFloat(completenessScore.toFixed(2)),
    metadata: {
      engine_version: '1.0',
      calculation_method: 'deterministic',
      loss_type_scores: lossDetection.scores,
      total_line_items: lineItems.length,
      total_expected_trades: totalExpected
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  analyzeLossExpectation,
  detectLossType,
  inferSeverity,
  getExpectedTrades,
  analyzeMissingTrades,
  WATER_EXPECTATIONS,
  FIRE_EXPECTATIONS,
  WIND_EXPECTATIONS,
  HAIL_EXPECTATIONS,
  COLLISION_EXPECTATIONS,
  TRADE_CODES
};

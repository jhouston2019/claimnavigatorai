/**
 * TRADE COMPLETENESS SCORING ENGINE
 * Deterministic scoring of trade completeness based on 5 criteria
 * 
 * Scores each trade 0-100 based on:
 * 1. Removal present (if needed)?
 * 2. Replacement present (if removal found)?
 * 3. Finish layer present (e.g., paint after drywall)?
 * 4. Material + labor present?
 * 5. Quantity consistency?
 * 
 * NO AI - Pure rule-based logic
 */

// ============================================================================
// TRADE DEFINITIONS
// ============================================================================

const TRADE_DEFINITIONS = {
  'Roofing': {
    code: 'RFG',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['roof', 'shingle', 'tile', 'metal roof', 'membrane', 'flashing', 'ridge', 'valley']
  },
  'Siding': {
    code: 'SID',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['siding', 'cladding', 'exterior wall', 'hardie', 'vinyl siding', 'fiber cement']
  },
  'Drywall': {
    code: 'DRY',
    requiresRemoval: true,
    requiresFinish: true,
    finishTrades: ['Painting'],
    keywords: ['drywall', 'sheetrock', 'gypsum', 'wallboard', 'ceiling', 'texture']
  },
  'Painting': {
    code: 'PNT',
    requiresRemoval: false,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['paint', 'primer', 'finish', 'coating', 'stain']
  },
  'Flooring': {
    code: 'FLR',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['floor', 'carpet', 'hardwood', 'tile', 'vinyl', 'laminate', 'lvp', 'subfloor']
  },
  'Framing': {
    code: 'FRM',
    requiresRemoval: true,
    requiresFinish: true,
    finishTrades: ['Drywall', 'Painting'],
    keywords: ['fram', 'stud', 'joist', 'beam', 'structural', 'lumber', '2x4', '2x6']
  },
  'Electrical': {
    code: 'ELE',
    requiresRemoval: false,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['electric', 'wiring', 'outlet', 'switch', 'circuit', 'breaker', 'panel', 'fixture']
  },
  'Plumbing': {
    code: 'PLM',
    requiresRemoval: false,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['plumb', 'pipe', 'drain', 'water line', 'fixture', 'faucet', 'toilet', 'sink']
  },
  'HVAC': {
    code: 'HVA',
    requiresRemoval: false,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['hvac', 'heating', 'cooling', 'air condition', 'furnace', 'duct', 'vent']
  },
  'Insulation': {
    code: 'INS',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['insulat', 'batt', 'blown', 'spray foam', 'r-value']
  },
  'Cabinets': {
    code: 'CAB',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['cabinet', 'vanity', 'cupboard', 'shelving']
  },
  'Countertops': {
    code: 'CTR',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['countertop', 'counter top', 'granite', 'quartz', 'laminate counter']
  },
  'Trim': {
    code: 'TRM',
    requiresRemoval: true,
    requiresFinish: true,
    finishTrades: ['Painting'],
    keywords: ['trim', 'baseboard', 'molding', 'casing', 'crown']
  },
  'Doors': {
    code: 'DOR',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['door', 'entry', 'interior door', 'exterior door', 'jamb', 'threshold']
  },
  'Windows': {
    code: 'WIN',
    requiresRemoval: true,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['window', 'glass', 'pane', 'sash', 'frame']
  },
  'Demolition': {
    code: 'DEM',
    requiresRemoval: false,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['demo', 'demolition', 'remove', 'tear out', 'disposal', 'haul']
  },
  'Cleaning': {
    code: 'CLN',
    requiresRemoval: false,
    requiresFinish: false,
    finishTrades: [],
    keywords: ['clean', 'sanitize', 'deodorize', 'disinfect']
  }
};

// ============================================================================
// ACTION TYPE DETECTION
// ============================================================================

/**
 * Detect action type from description
 */
function detectActionType(description) {
  const desc = description.toLowerCase();
  
  // Removal keywords
  if (desc.match(/remove|demo|demolition|tear out|strip|dispose|haul/i)) {
    return 'REMOVE';
  }
  
  // Installation keywords
  if (desc.match(/install|replace|new|add/i)) {
    return 'INSTALL';
  }
  
  // Repair keywords
  if (desc.match(/repair|fix|patch/i)) {
    return 'REPAIR';
  }
  
  // Material only
  if (desc.match(/material only|materials only|supply only/i)) {
    return 'MATERIAL_ONLY';
  }
  
  // Labor only
  if (desc.match(/labor only|installation only|install only/i)) {
    return 'LABOR_ONLY';
  }
  
  return 'UNKNOWN';
}

// ============================================================================
// TRADE GROUPING
// ============================================================================

/**
 * Group line items by trade
 */
function groupByTrade(lineItems) {
  const tradeGroups = {};
  
  for (const item of lineItems) {
    let assignedTrade = null;
    
    // Try category first
    if (item.category) {
      assignedTrade = item.category;
    }
    
    // Try keyword matching
    if (!assignedTrade) {
      const desc = (item.description || '').toLowerCase();
      
      for (const [tradeName, tradeDef] of Object.entries(TRADE_DEFINITIONS)) {
        for (const keyword of tradeDef.keywords) {
          if (desc.includes(keyword)) {
            assignedTrade = tradeName;
            break;
          }
        }
        if (assignedTrade) break;
      }
    }
    
    // Default to "Other"
    if (!assignedTrade) {
      assignedTrade = 'Other';
    }
    
    // Initialize trade group
    if (!tradeGroups[assignedTrade]) {
      tradeGroups[assignedTrade] = {
        trade: assignedTrade,
        code: TRADE_DEFINITIONS[assignedTrade]?.code || 'OTH',
        items: [],
        requiresRemoval: TRADE_DEFINITIONS[assignedTrade]?.requiresRemoval || false,
        requiresFinish: TRADE_DEFINITIONS[assignedTrade]?.requiresFinish || false,
        finishTrades: TRADE_DEFINITIONS[assignedTrade]?.finishTrades || []
      };
    }
    
    // Add item to group
    tradeGroups[assignedTrade].items.push({
      ...item,
      actionType: detectActionType(item.description || '')
    });
  }
  
  return Object.values(tradeGroups);
}

// ============================================================================
// COMPLETENESS SCORING
// ============================================================================

/**
 * Score trade completeness (0-100)
 */
function scoreTradeCompleteness(tradeGroup, allTradeGroups) {
  let score = 100;
  const issues = [];
  
  const items = tradeGroup.items;
  
  // =====================================================
  // CRITERION 1: REMOVAL PRESENT (if needed)?
  // =====================================================
  const hasRemoval = items.some(item => item.actionType === 'REMOVE');
  const hasInstall = items.some(item => 
    item.actionType === 'INSTALL' || item.actionType === 'REPAIR'
  );
  
  if (tradeGroup.requiresRemoval && hasInstall && !hasRemoval) {
    score -= 20;
    issues.push({
      criterion: 'removal_missing',
      severity: 'HIGH',
      description: 'Installation/replacement without removal detected',
      impact: 'Missing demolition costs',
      recommendation: 'Verify if removal/demolition is included elsewhere or add removal line items'
    });
  }
  
  // =====================================================
  // CRITERION 2: REPLACEMENT PRESENT (if removal found)?
  // =====================================================
  if (hasRemoval && !hasInstall) {
    score -= 25;
    issues.push({
      criterion: 'replacement_missing',
      severity: 'CRITICAL',
      description: 'Removal without replacement detected',
      impact: 'Incomplete scope - work not finished',
      recommendation: 'Add replacement/installation line items to complete scope'
    });
  }
  
  // =====================================================
  // CRITERION 3: FINISH LAYER PRESENT?
  // =====================================================
  if (tradeGroup.requiresFinish) {
    let finishPresent = false;
    
    for (const finishTrade of tradeGroup.finishTrades) {
      const finishGroup = allTradeGroups.find(g => g.trade === finishTrade);
      if (finishGroup && finishGroup.items.length > 0) {
        finishPresent = true;
        break;
      }
    }
    
    if (!finishPresent) {
      score -= 15;
      issues.push({
        criterion: 'finish_missing',
        severity: 'HIGH',
        description: `${tradeGroup.trade} without finish layer (${tradeGroup.finishTrades.join(', ')})`,
        impact: 'Missing finish layer - incomplete restoration',
        recommendation: `Add ${tradeGroup.finishTrades.join(' or ')} to complete work`
      });
    }
  }
  
  // =====================================================
  // CRITERION 4: MATERIAL + LABOR PRESENT?
  // =====================================================
  const materialOnly = items.some(item => item.actionType === 'MATERIAL_ONLY');
  const laborOnly = items.some(item => item.actionType === 'LABOR_ONLY');
  
  if (materialOnly && !hasCorrespondingLabor(items)) {
    score -= 15;
    issues.push({
      criterion: 'labor_missing',
      severity: 'MODERATE',
      description: 'Material without corresponding labor detected',
      impact: 'Missing installation costs',
      recommendation: 'Add labor/installation line items or verify labor is included in material pricing'
    });
  }
  
  if (laborOnly && !hasCorrespondingMaterial(items)) {
    score -= 15;
    issues.push({
      criterion: 'material_missing',
      severity: 'MODERATE',
      description: 'Labor without corresponding material detected',
      impact: 'Missing material costs',
      recommendation: 'Add material line items or verify material is included in labor pricing'
    });
  }
  
  // =====================================================
  // CRITERION 5: QUANTITY CONSISTENCY?
  // =====================================================
  const removalQty = sumQuantities(items.filter(i => i.actionType === 'REMOVE'));
  const installQty = sumQuantities(items.filter(i => i.actionType === 'INSTALL'));
  
  if (removalQty > 0 && installQty > 0) {
    const variance = Math.abs(removalQty - installQty) / removalQty;
    
    if (variance > 0.15) { // >15% variance
      score -= 10;
      issues.push({
        criterion: 'quantity_mismatch',
        severity: 'MODERATE',
        description: `Quantity mismatch: ${removalQty.toFixed(2)} removed vs ${installQty.toFixed(2)} installed`,
        impact: 'Incomplete scope or calculation error',
        recommendation: 'Verify quantities match between removal and installation'
      });
    }
  }
  
  return {
    trade: tradeGroup.trade,
    tradeName: tradeGroup.trade,
    tradeCode: tradeGroup.code,
    score: Math.max(0, score),
    issues,
    itemCount: items.length,
    hasRemoval,
    hasInstall,
    removalQty,
    installQty
  };
}

/**
 * Check if labor is present for material-only items
 */
function hasCorrespondingLabor(items) {
  return items.some(item => 
    item.actionType === 'LABOR_ONLY' || 
    item.actionType === 'INSTALL' ||
    (item.description || '').match(/install|labor/i)
  );
}

/**
 * Check if material is present for labor-only items
 */
function hasCorrespondingMaterial(items) {
  return items.some(item => 
    item.actionType === 'MATERIAL_ONLY' || 
    (item.description || '').match(/material|supply/i)
  );
}

/**
 * Sum quantities across items
 */
function sumQuantities(items) {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

// ============================================================================
// OVERALL INTEGRITY SCORE
// ============================================================================

/**
 * Calculate overall structural integrity score
 */
function calculateIntegrityScore(tradeScores) {
  if (tradeScores.length === 0) return 100;
  
  // Weight by item count
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const tradeScore of tradeScores) {
    const weight = tradeScore.itemCount;
    totalWeightedScore += tradeScore.score * weight;
    totalWeight += weight;
  }
  
  const weightedAvg = totalWeight > 0 ? totalWeightedScore / totalWeight : 100;
  
  // Penalize for critical issues
  const criticalIssues = tradeScores.reduce((sum, ts) => 
    sum + ts.issues.filter(i => i.severity === 'CRITICAL').length, 0
  );
  
  const penalty = criticalIssues * 5; // -5 points per critical issue
  
  return Math.max(0, Math.min(100, weightedAvg - penalty));
}

/**
 * Classify overall integrity
 */
function classifyIntegrity(score) {
  if (score >= 90) return { level: 'EXCELLENT', description: 'Estimate is structurally complete' };
  if (score >= 75) return { level: 'GOOD', description: 'Minor completeness issues' };
  if (score >= 60) return { level: 'FAIR', description: 'Moderate completeness issues' };
  if (score >= 40) return { level: 'POOR', description: 'Significant completeness issues' };
  return { level: 'CRITICAL', description: 'Major completeness issues - estimate may be incomplete' };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze trade completeness
 * @param {object} params - Input parameters
 * @returns {object} Trade completeness analysis
 */
function analyzeTradeCompleteness(params) {
  const {
    lineItems = [],
    metadata = {}
  } = params;
  
  if (lineItems.length === 0) {
    return {
      success: false,
      error: 'No line items provided'
    };
  }
  
  // Step 1: Group by trade
  const tradeGroups = groupByTrade(lineItems);
  
  // Step 2: Score each trade
  const tradeScores = [];
  
  for (const tradeGroup of tradeGroups) {
    const score = scoreTradeCompleteness(tradeGroup, tradeGroups);
    tradeScores.push(score);
  }
  
  // Step 3: Calculate overall integrity score
  const integrityScore = calculateIntegrityScore(tradeScores);
  const integrityClassification = classifyIntegrity(integrityScore);
  
  // Step 4: Collect all critical issues
  const criticalIssues = [];
  const highIssues = [];
  const moderateIssues = [];
  
  for (const tradeScore of tradeScores) {
    for (const issue of tradeScore.issues) {
      const issueWithTrade = {
        ...issue,
        trade: tradeScore.trade
      };
      
      if (issue.severity === 'CRITICAL') {
        criticalIssues.push(issueWithTrade);
      } else if (issue.severity === 'HIGH') {
        highIssues.push(issueWithTrade);
      } else {
        moderateIssues.push(issueWithTrade);
      }
    }
  }
  
  // Step 5: Sort trade scores by score (lowest first)
  tradeScores.sort((a, b) => a.score - b.score);
  
  return {
    success: true,
    integrityScore: parseFloat(integrityScore.toFixed(2)),
    integrityLevel: integrityClassification.level,
    integrityDescription: integrityClassification.description,
    tradeScores,
    criticalIssues,
    highIssues,
    moderateIssues,
    summary: {
      total_trades: tradeScores.length,
      trades_with_issues: tradeScores.filter(ts => ts.issues.length > 0).length,
      critical_issues_count: criticalIssues.length,
      high_issues_count: highIssues.length,
      moderate_issues_count: moderateIssues.length,
      average_trade_score: tradeScores.length > 0 
        ? parseFloat((tradeScores.reduce((sum, ts) => sum + ts.score, 0) / tradeScores.length).toFixed(2))
        : 100
    },
    metadata: {
      engine_version: '1.0',
      calculation_method: 'deterministic',
      criteria_evaluated: 5,
      total_line_items: lineItems.length
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  analyzeTradeCompleteness,
  groupByTrade,
  scoreTradeCompleteness,
  calculateIntegrityScore,
  classifyIntegrity,
  detectActionType,
  TRADE_DEFINITIONS
};

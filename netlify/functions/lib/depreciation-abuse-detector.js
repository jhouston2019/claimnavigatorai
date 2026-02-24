/**
 * Depreciation Abuse Detection Engine
 * Detects excessive depreciation, misapplied schedules, and carrier depreciation tactics
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Standard depreciation schedules by category
 * Based on IRS Publication 946 and insurance industry standards
 */
const DEPRECIATION_SCHEDULES = {
  // Roofing
  'asphalt_shingles': { useful_life: 20, method: 'straight_line', max_depreciation: 0.95 },
  'metal_roof': { useful_life: 50, method: 'straight_line', max_depreciation: 0.90 },
  'tile_roof': { useful_life: 50, method: 'straight_line', max_depreciation: 0.90 },
  'flat_roof': { useful_life: 15, method: 'straight_line', max_depreciation: 0.95 },
  
  // HVAC
  'hvac_system': { useful_life: 15, method: 'straight_line', max_depreciation: 0.90 },
  'furnace': { useful_life: 20, method: 'straight_line', max_depreciation: 0.90 },
  'air_conditioner': { useful_life: 15, method: 'straight_line', max_depreciation: 0.90 },
  'water_heater': { useful_life: 10, method: 'straight_line', max_depreciation: 0.85 },
  
  // Appliances
  'refrigerator': { useful_life: 13, method: 'straight_line', max_depreciation: 0.85 },
  'dishwasher': { useful_life: 9, method: 'straight_line', max_depreciation: 0.85 },
  'washer_dryer': { useful_life: 11, method: 'straight_line', max_depreciation: 0.85 },
  'range_oven': { useful_life: 13, method: 'straight_line', max_depreciation: 0.85 },
  
  // Flooring
  'carpet': { useful_life: 10, method: 'straight_line', max_depreciation: 0.90 },
  'hardwood': { useful_life: 100, method: 'straight_line', max_depreciation: 0.50 },
  'tile': { useful_life: 75, method: 'straight_line', max_depreciation: 0.60 },
  'vinyl': { useful_life: 20, method: 'straight_line', max_depreciation: 0.85 },
  
  // Structure
  'framing': { useful_life: 100, method: 'straight_line', max_depreciation: 0.30 },
  'foundation': { useful_life: 100, method: 'straight_line', max_depreciation: 0.20 },
  'drywall': { useful_life: 70, method: 'straight_line', max_depreciation: 0.50 },
  'insulation': { useful_life: 100, method: 'straight_line', max_depreciation: 0.40 },
  
  // Exterior
  'siding': { useful_life: 50, method: 'straight_line', max_depreciation: 0.70 },
  'windows': { useful_life: 20, method: 'straight_line', max_depreciation: 0.80 },
  'doors': { useful_life: 30, method: 'straight_line', max_depreciation: 0.75 },
  'gutters': { useful_life: 20, method: 'straight_line', max_depreciation: 0.80 },
  
  // Paint
  'interior_paint': { useful_life: 7, method: 'straight_line', max_depreciation: 0.90 },
  'exterior_paint': { useful_life: 10, method: 'straight_line', max_depreciation: 0.90 }
};

/**
 * Items that should NEVER have depreciation applied (RCV policies)
 */
const NON_DEPRECIABLE_ITEMS = [
  'labor',
  'installation',
  'removal',
  'demolition',
  'disposal',
  'permit',
  'inspection',
  'overhead',
  'profit',
  'supervision',
  'cleanup',
  'protection',
  'temporary'
];

/**
 * Classify item category for depreciation lookup
 */
function classifyForDepreciation(description) {
  const normalized = description.toLowerCase();
  
  // Check for non-depreciable keywords
  for (const keyword of NON_DEPRECIABLE_ITEMS) {
    if (normalized.includes(keyword)) {
      return { category: 'non_depreciable', keyword };
    }
  }
  
  // Map to depreciation schedule
  const mappings = {
    'shingle': 'asphalt_shingles',
    'roof': 'asphalt_shingles',
    'metal_roof': 'metal_roof',
    'tile_roof': 'tile_roof',
    'hvac': 'hvac_system',
    'furnace': 'furnace',
    'air_condition': 'air_conditioner',
    'ac_unit': 'air_conditioner',
    'water_heater': 'water_heater',
    'refrigerator': 'refrigerator',
    'dishwasher': 'dishwasher',
    'washer': 'washer_dryer',
    'dryer': 'washer_dryer',
    'range': 'range_oven',
    'oven': 'range_oven',
    'carpet': 'carpet',
    'hardwood': 'hardwood',
    'tile': 'tile',
    'vinyl': 'vinyl',
    'framing': 'framing',
    'foundation': 'foundation',
    'drywall': 'drywall',
    'sheetrock': 'drywall',
    'insulation': 'insulation',
    'siding': 'siding',
    'window': 'windows',
    'door': 'doors',
    'gutter': 'gutters',
    'paint': normalized.includes('exterior') ? 'exterior_paint' : 'interior_paint'
  };
  
  for (const [keyword, category] of Object.entries(mappings)) {
    if (normalized.includes(keyword)) {
      return { category, schedule: DEPRECIATION_SCHEDULES[category] };
    }
  }
  
  return { category: 'unknown', schedule: null };
}

/**
 * Calculate expected depreciation
 */
function calculateExpectedDepreciation(rcvAmount, age, category) {
  const classification = classifyForDepreciation(category);
  
  if (classification.category === 'non_depreciable') {
    return {
      expected_depreciation: 0,
      expected_acv: rcvAmount,
      depreciation_percent: 0,
      reason: `Labor and installation costs are not depreciable`,
      should_depreciate: false
    };
  }
  
  if (!classification.schedule) {
    return {
      expected_depreciation: null,
      expected_acv: null,
      depreciation_percent: null,
      reason: 'No depreciation schedule available for this item',
      should_depreciate: true
    };
  }
  
  const schedule = classification.schedule;
  const annualDepreciation = 1 / schedule.useful_life;
  const totalDepreciation = Math.min(annualDepreciation * age, schedule.max_depreciation);
  const expectedACV = rcvAmount * (1 - totalDepreciation);
  
  return {
    expected_depreciation: rcvAmount - expectedACV,
    expected_acv: expectedACV,
    depreciation_percent: totalDepreciation * 100,
    annual_depreciation_rate: annualDepreciation * 100,
    useful_life: schedule.useful_life,
    max_depreciation: schedule.max_depreciation * 100,
    reason: `Based on ${schedule.useful_life}-year useful life`,
    should_depreciate: true
  };
}

/**
 * Detect depreciation abuse patterns
 */
function detectDepreciationAbuse(lineItem, policyData) {
  const abuses = [];
  
  // Check 1: Depreciation on RCV policy (except roof with ACV endorsement)
  if (policyData.settlement_type === 'RCV' && lineItem.depreciation > 0) {
    const isRoof = lineItem.description.toLowerCase().includes('roof') || 
                   lineItem.description.toLowerCase().includes('shingle');
    
    if (!isRoof || !policyData.roof_acv_endorsement) {
      abuses.push({
        type: 'rcv_policy_depreciation',
        severity: 'critical',
        description: lineItem.description,
        applied_depreciation: lineItem.depreciation,
        message: 'Depreciation applied to RCV policy item. Policy provides Replacement Cost Value coverage.',
        recovery_amount: lineItem.depreciation,
        policy_basis: 'RCV policy prohibits depreciation except for roof with ACV endorsement'
      });
    }
  }
  
  // Check 2: Depreciation on non-depreciable items
  const classification = classifyForDepreciation(lineItem.description);
  if (classification.category === 'non_depreciable' && lineItem.depreciation > 0) {
    abuses.push({
      type: 'labor_depreciation',
      severity: 'critical',
      description: lineItem.description,
      applied_depreciation: lineItem.depreciation,
      message: `Depreciation applied to ${classification.keyword}. Labor and installation costs are never depreciable.`,
      recovery_amount: lineItem.depreciation,
      policy_basis: 'Labor costs are not subject to depreciation under any policy type'
    });
  }
  
  // Check 3: Excessive depreciation beyond schedule
  if (lineItem.age && lineItem.depreciation > 0 && classification.schedule) {
    const expected = calculateExpectedDepreciation(
      lineItem.rcv || (lineItem.acv + lineItem.depreciation),
      lineItem.age,
      lineItem.description
    );
    
    if (expected.expected_depreciation !== null) {
      const actualDepreciationPercent = (lineItem.depreciation / (lineItem.acv + lineItem.depreciation)) * 100;
      const excessDepreciation = actualDepreciationPercent - expected.depreciation_percent;
      
      if (excessDepreciation > 10) {
        abuses.push({
          type: 'excessive_depreciation',
          severity: 'high',
          description: lineItem.description,
          applied_depreciation: lineItem.depreciation,
          applied_depreciation_percent: actualDepreciationPercent,
          expected_depreciation: expected.expected_depreciation,
          expected_depreciation_percent: expected.depreciation_percent,
          excess_amount: lineItem.depreciation - expected.expected_depreciation,
          message: `Depreciation of ${actualDepreciationPercent.toFixed(1)}% exceeds standard ${expected.depreciation_percent.toFixed(1)}% for ${lineItem.age}-year-old ${classification.category}`,
          recovery_amount: lineItem.depreciation - expected.expected_depreciation,
          policy_basis: `Standard ${expected.useful_life}-year useful life schedule`
        });
      }
    }
  }
  
  // Check 4: Depreciation exceeds maximum threshold
  if (classification.schedule && lineItem.depreciation > 0) {
    const rcv = lineItem.rcv || (lineItem.acv + lineItem.depreciation);
    const depreciationPercent = (lineItem.depreciation / rcv) * 100;
    const maxAllowed = classification.schedule.max_depreciation * 100;
    
    if (depreciationPercent > maxAllowed) {
      abuses.push({
        type: 'depreciation_cap_exceeded',
        severity: 'high',
        description: lineItem.description,
        applied_depreciation_percent: depreciationPercent,
        max_allowed_percent: maxAllowed,
        excess_amount: (depreciationPercent - maxAllowed) / 100 * rcv,
        message: `Depreciation of ${depreciationPercent.toFixed(1)}% exceeds maximum ${maxAllowed}% for ${classification.category}`,
        recovery_amount: (depreciationPercent - maxAllowed) / 100 * rcv,
        policy_basis: `Industry standard maximum depreciation cap`
      });
    }
  }
  
  // Check 5: Uniform depreciation rate (red flag)
  // This is checked at the estimate level, not line item level
  
  return abuses;
}

/**
 * Detect uniform depreciation rate pattern (carrier tactic)
 */
function detectUniformDepreciation(lineItems) {
  const depreciatedItems = lineItems.filter(item => item.depreciation > 0);
  
  if (depreciatedItems.length < 3) {
    return null;
  }
  
  // Calculate depreciation percentages
  const depreciationRates = depreciatedItems.map(item => {
    const rcv = item.rcv || (item.acv + item.depreciation);
    return (item.depreciation / rcv) * 100;
  });
  
  // Check if all rates are within 5% of each other (suspicious)
  const avgRate = depreciationRates.reduce((sum, rate) => sum + rate, 0) / depreciationRates.length;
  const allSimilar = depreciationRates.every(rate => Math.abs(rate - avgRate) < 5);
  
  if (allSimilar && depreciatedItems.length >= 5) {
    const totalExcessDepreciation = depreciatedItems.reduce((sum, item) => {
      const classification = classifyForDepreciation(item.description);
      if (classification.schedule && item.age) {
        const expected = calculateExpectedDepreciation(
          item.rcv || (item.acv + item.depreciation),
          item.age,
          item.description
        );
        if (expected.expected_depreciation !== null) {
          return sum + Math.max(0, item.depreciation - expected.expected_depreciation);
        }
      }
      return sum;
    }, 0);
    
    return {
      type: 'uniform_depreciation_pattern',
      severity: 'high',
      affected_items: depreciatedItems.length,
      uniform_rate: avgRate,
      message: `Carrier applied uniform ${avgRate.toFixed(1)}% depreciation to ${depreciatedItems.length} items. This is a red flag indicating blanket depreciation rather than item-specific analysis.`,
      recovery_potential: totalExcessDepreciation,
      policy_basis: 'Depreciation must be calculated individually based on actual age and condition, not applied uniformly'
    };
  }
  
  return null;
}

/**
 * Detect missing age documentation
 */
function detectMissingAgeDocumentation(lineItems, policyData) {
  const depreciatedItems = lineItems.filter(item => item.depreciation > 0);
  const itemsWithoutAge = depreciatedItems.filter(item => !item.age || item.age === 0);
  
  if (itemsWithoutAge.length > 0) {
    return {
      type: 'missing_age_documentation',
      severity: 'high',
      affected_items: itemsWithoutAge.length,
      items: itemsWithoutAge.map(item => ({
        description: item.description,
        depreciation: item.depreciation,
        depreciation_percent: (item.depreciation / (item.acv + item.depreciation)) * 100
      })),
      message: `Carrier applied depreciation to ${itemsWithoutAge.length} items without documenting age or condition. Depreciation requires substantiation.`,
      action: 'Request carrier provide age documentation and depreciation calculation methodology for all depreciated items',
      policy_basis: 'Carrier bears burden of proof for depreciation application'
    };
  }
  
  return null;
}

/**
 * Detect betterment claims (carrier tactic)
 */
function detectBettermentClaims(lineItems, policyData) {
  const bettermentFlags = [];
  
  for (const item of lineItems) {
    const description = item.description.toLowerCase();
    
    // Check for betterment language
    if (description.includes('betterment') || 
        description.includes('upgrade') || 
        description.includes('improvement')) {
      
      // Check if this is legitimate code upgrade vs betterment claim
      const isCodeUpgrade = description.includes('code') || 
                           description.includes('ordinance') ||
                           description.includes('required');
      
      if (!isCodeUpgrade && item.depreciation > 0) {
        bettermentFlags.push({
          type: 'betterment_depreciation',
          severity: 'high',
          description: item.description,
          depreciation: item.depreciation,
          message: `Carrier claiming "betterment" to justify depreciation. Matching quality materials is not betterment.`,
          recovery_amount: item.depreciation,
          policy_basis: 'Policy requires like-kind-and-quality replacement. Modern materials meeting current standards are not betterment.'
        });
      }
    }
  }
  
  return bettermentFlags;
}

/**
 * Detect ACV policy with excessive depreciation
 */
function detectExcessiveACVDepreciation(lineItems, policyData) {
  if (policyData.settlement_type !== 'ACV') {
    return [];
  }
  
  const excessiveItems = [];
  
  for (const item of lineItems) {
    if (!item.depreciation || !item.age) continue;
    
    const classification = classifyForDepreciation(item.description);
    if (!classification.schedule) continue;
    
    const expected = calculateExpectedDepreciation(
      item.rcv || (item.acv + item.depreciation),
      item.age,
      item.description
    );
    
    if (expected.expected_depreciation === null) continue;
    
    const actualPercent = (item.depreciation / (item.acv + item.depreciation)) * 100;
    const excessPercent = actualPercent - expected.depreciation_percent;
    
    if (excessPercent > 15) {
      excessiveItems.push({
        type: 'excessive_acv_depreciation',
        severity: 'high',
        description: item.description,
        age: item.age,
        applied_depreciation: item.depreciation,
        applied_percent: actualPercent,
        expected_depreciation: expected.expected_depreciation,
        expected_percent: expected.depreciation_percent,
        excess_amount: item.depreciation - expected.expected_depreciation,
        message: `Applied ${actualPercent.toFixed(1)}% depreciation exceeds standard ${expected.depreciation_percent.toFixed(1)}% for ${item.age}-year-old item`,
        recovery_amount: item.depreciation - expected.expected_depreciation,
        policy_basis: `Standard ${expected.useful_life}-year useful life schedule`
      });
    }
  }
  
  return excessiveItems;
}

/**
 * Analyze depreciation across entire estimate
 */
function analyzeDepreciation(lineItems, policyData) {
  console.log('[Depreciation Detector] Analyzing depreciation patterns...');
  
  const abuses = [];
  
  // Check each line item for depreciation abuse
  for (const item of lineItems) {
    if (item.depreciation && item.depreciation > 0) {
      const itemAbuses = detectDepreciationAbuse(item, policyData);
      abuses.push(...itemAbuses);
    }
  }
  
  // Check for uniform depreciation pattern
  const uniformPattern = detectUniformDepreciation(lineItems);
  if (uniformPattern) {
    abuses.push(uniformPattern);
  }
  
  // Check for missing age documentation
  const missingAge = detectMissingAgeDocumentation(lineItems, policyData);
  if (missingAge) {
    abuses.push(missingAge);
  }
  
  // Check for betterment claims
  const bettermentClaims = detectBettermentClaims(lineItems, policyData);
  abuses.push(...bettermentClaims);
  
  // Check for excessive ACV depreciation
  const excessiveACV = detectExcessiveACVDepreciation(lineItems, policyData);
  abuses.push(...excessiveACV);
  
  // Calculate summary
  const summary = {
    total_items_checked: lineItems.length,
    items_with_depreciation: lineItems.filter(i => i.depreciation > 0).length,
    abuses_detected: abuses.length,
    critical_abuses: abuses.filter(a => a.severity === 'critical').length,
    high_abuses: abuses.filter(a => a.severity === 'high').length,
    total_recovery_potential: abuses.reduce((sum, a) => sum + (a.recovery_amount || 0), 0),
    patterns_detected: []
  };
  
  if (uniformPattern) {
    summary.patterns_detected.push('uniform_depreciation');
  }
  if (missingAge) {
    summary.patterns_detected.push('missing_age_documentation');
  }
  if (bettermentClaims.length > 0) {
    summary.patterns_detected.push('betterment_claims');
  }
  
  console.log(`[Depreciation Detector] Found ${abuses.length} depreciation issues, potential recovery: $${summary.total_recovery_potential.toFixed(2)}`);
  
  return {
    abuses,
    summary
  };
}

/**
 * Generate depreciation abuse report
 */
function generateDepreciationReport(analysis, policyData) {
  const report = {
    policy_type: policyData.settlement_type,
    has_roof_acv_endorsement: policyData.roof_acv_endorsement || false,
    analysis: analysis.summary,
    critical_findings: analysis.abuses.filter(a => a.severity === 'critical'),
    high_priority_findings: analysis.abuses.filter(a => a.severity === 'high'),
    recommendations: []
  };
  
  // Generate recommendations
  if (analysis.summary.critical_abuses > 0) {
    report.recommendations.push({
      priority: 'critical',
      category: 'depreciation_abuse',
      title: 'Improper Depreciation Detected',
      description: `${analysis.summary.critical_abuses} critical depreciation violations found`,
      action: 'Submit formal objection citing policy language and depreciation standards',
      estimated_recovery: analysis.abuses
        .filter(a => a.severity === 'critical')
        .reduce((sum, a) => sum + (a.recovery_amount || 0), 0)
    });
  }
  
  if (analysis.summary.patterns_detected.includes('uniform_depreciation')) {
    report.recommendations.push({
      priority: 'high',
      category: 'depreciation_methodology',
      title: 'Uniform Depreciation Pattern Detected',
      description: 'Carrier applied blanket depreciation rate instead of item-specific analysis',
      action: 'Request detailed depreciation schedule with age documentation for each item',
      estimated_recovery: analysis.abuses
        .find(a => a.type === 'uniform_depreciation_pattern')?.recovery_potential || 0
    });
  }
  
  if (analysis.summary.patterns_detected.includes('missing_age_documentation')) {
    report.recommendations.push({
      priority: 'high',
      category: 'burden_of_proof',
      title: 'Missing Age Documentation',
      description: 'Carrier applied depreciation without substantiating age or condition',
      action: 'Invoke burden of proof: Carrier must document age and condition for all depreciated items',
      estimated_recovery: null
    });
  }
  
  return report;
}

/**
 * AI-powered depreciation analysis for complex cases
 */
async function aiDepreciationAnalysis(lineItems, policyData) {
  const itemsWithDepreciation = lineItems.filter(item => item.depreciation > 0);
  
  if (itemsWithDepreciation.length === 0) {
    return null;
  }
  
  const prompt = `You are an insurance depreciation expert. Analyze the following depreciation applications for potential abuse or errors.

Policy Type: ${policyData.settlement_type}
Roof ACV Endorsement: ${policyData.roof_acv_endorsement ? 'Yes' : 'No'}

Depreciated Items:
${itemsWithDepreciation.slice(0, 20).map((item, idx) => 
  `${idx + 1}. ${item.description} - Age: ${item.age || 'Unknown'} - RCV: $${item.rcv || (item.acv + item.depreciation)} - Depreciation: $${item.depreciation} (${((item.depreciation / (item.acv + item.depreciation)) * 100).toFixed(1)}%)`
).join('\n')}

Identify:
1. Items that should not be depreciated (labor, installation, etc.)
2. Items with excessive depreciation beyond standard schedules
3. Items missing age documentation
4. Suspicious patterns (uniform rates, betterment claims)
5. Policy violations (RCV policy with depreciation)

Return JSON with format:
{
  "findings": [
    {
      "line_number": number,
      "issue_type": string,
      "severity": "critical" | "high" | "medium",
      "description": string,
      "recovery_amount": number,
      "recommendation": string
    }
  ],
  "overall_assessment": string,
  "red_flags": [string]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an insurance depreciation expert specializing in detecting carrier tactics and depreciation abuse.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const response = JSON.parse(completion.choices[0].message.content);
    
    return {
      findings: response.findings || [],
      overall_assessment: response.overall_assessment || '',
      red_flags: response.red_flags || [],
      ai_model: 'gpt-4-turbo-preview',
      ai_confidence: 0.80
    };
  } catch (error) {
    console.error('AI depreciation analysis error:', error);
    return null;
  }
}

/**
 * Main depreciation abuse detection function
 */
async function detectDepreciationAbuse(carrierLineItems, policyData, contractorLineItems = null) {
  console.log('[Depreciation Abuse Detector] Starting analysis...');
  
  // Deterministic analysis
  const deterministicAnalysis = analyzeDepreciation(carrierLineItems, policyData);
  
  // AI analysis for complex cases
  const aiAnalysis = await aiDepreciationAnalysis(carrierLineItems, policyData);
  
  // Generate comprehensive report
  const report = generateDepreciationReport(deterministicAnalysis, policyData);
  
  // Add AI insights
  if (aiAnalysis) {
    report.ai_analysis = aiAnalysis;
  }
  
  console.log(`[Depreciation Abuse Detector] Complete. Found ${deterministicAnalysis.summary.abuses_detected} issues.`);
  
  return {
    deterministic: deterministicAnalysis,
    ai: aiAnalysis,
    report
  };
}

module.exports = {
  detectDepreciationAbuse,
  analyzeDepreciation,
  calculateExpectedDepreciation,
  detectUniformDepreciation,
  detectMissingAgeDocumentation,
  detectBettermentClaims,
  detectExcessiveACVDepreciation,
  DEPRECIATION_SCHEDULES,
  NON_DEPRECIABLE_ITEMS
};

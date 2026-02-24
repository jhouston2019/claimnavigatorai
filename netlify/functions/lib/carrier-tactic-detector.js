/**
 * Carrier Tactic Recognition Engine
 * Detects common carrier tactics used to reduce claim payments
 * Pattern recognition for scope reduction, material downgrade, labor suppression, etc.
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Common carrier tactics database
 */
const CARRIER_TACTICS = {
  // Scope reduction tactics
  scope_reduction: {
    patterns: [
      'partial_repair_only',
      'spot_repair_vs_full_replacement',
      'minimum_code_compliance',
      'repair_vs_replace',
      'exclude_hidden_damage'
    ],
    keywords: ['patch', 'spot', 'partial', 'minimum', 'repair only', 'localized']
  },
  
  // Material downgrade tactics
  material_downgrade: {
    patterns: [
      'lower_grade_material',
      'generic_vs_brand_name',
      'economy_grade',
      'builder_grade_substitution'
    ],
    keywords: ['economy', 'builder grade', 'standard', 'basic', 'generic', 'similar', 'comparable']
  },
  
  // Labor rate suppression
  labor_suppression: {
    patterns: [
      'below_prevailing_wage',
      'helper_rate_vs_journeyman',
      'unlicensed_contractor_rate'
    ],
    keywords: ['helper', 'assistant', 'unskilled', 'apprentice']
  },
  
  // Code upgrade denial
  code_upgrade_denial: {
    patterns: [
      'deny_ordinance_law',
      'minimum_code_only',
      'betterment_claim',
      'pre_existing_condition'
    ],
    keywords: ['betterment', 'upgrade', 'improvement', 'pre-existing', 'not covered']
  },
  
  // Depreciation tactics
  depreciation_tactics: {
    patterns: [
      'uniform_depreciation',
      'excessive_depreciation',
      'depreciate_labor',
      'depreciate_non_depreciable'
    ],
    keywords: ['depreciation', 'wear and tear', 'age', 'condition', 'useful life']
  },
  
  // Causation challenges
  causation_challenge: {
    patterns: [
      'pre_existing_damage',
      'maintenance_issue',
      'gradual_deterioration',
      'unrelated_damage'
    ],
    keywords: ['pre-existing', 'maintenance', 'wear', 'gradual', 'unrelated', 'not caused by']
  },
  
  // Coverage limitations
  coverage_limitation: {
    patterns: [
      'sublimit_application',
      'policy_exclusion',
      'coverage_cap',
      'per_occurrence_limit'
    ],
    keywords: ['limit', 'cap', 'maximum', 'sublimit', 'excluded', 'not covered']
  },
  
  // Documentation requirements
  documentation_burden: {
    patterns: [
      'insufficient_documentation',
      'require_additional_proof',
      'need_expert_opinion',
      'require_testing'
    ],
    keywords: ['insufficient', 'additional documentation', 'proof required', 'must provide']
  }
};

/**
 * Detect scope reduction tactics
 */
function detectScopeReduction(contractorItems, carrierItems, matchedPairs) {
  const tactics = [];
  
  for (const pair of matchedPairs) {
    const contractor = contractorItems.find(i => i.id === pair.contractor_line_id);
    const carrier = carrierItems.find(i => i.id === pair.carrier_line_id);
    
    if (!contractor || !carrier) continue;
    
    const contractorDesc = contractor.description.toLowerCase();
    const carrierDesc = carrier.description.toLowerCase();
    
    // Check for "repair" vs "replace" language change
    if (contractorDesc.includes('replace') && carrierDesc.includes('repair')) {
      const savings = contractor.total - carrier.total;
      if (savings > 100) {
        tactics.push({
          type: 'repair_vs_replace',
          severity: 'high',
          description: contractor.description,
          contractor_scope: 'Replace',
          carrier_scope: 'Repair',
          contractor_total: contractor.total,
          carrier_total: carrier.total,
          reduction_amount: savings,
          message: 'Carrier changed scope from "replace" to "repair" to reduce payment',
          recommendation: 'Challenge scope reduction. If item cannot be properly repaired, replacement is required.',
          policy_basis: 'Policy requires restoration to pre-loss condition'
        });
      }
    }
    
    // Check for "partial" vs "full" scope reduction
    if (contractorDesc.includes('full') && carrierDesc.includes('partial')) {
      tactics.push({
        type: 'partial_vs_full',
        severity: 'high',
        description: contractor.description,
        contractor_scope: 'Full',
        carrier_scope: 'Partial',
        contractor_total: contractor.total,
        carrier_total: carrier.total,
        reduction_amount: contractor.total - carrier.total,
        message: 'Carrier reduced scope from full to partial repair',
        recommendation: 'Document why full scope is necessary (matching, code compliance, structural integrity)',
        policy_basis: 'Partial repairs may not restore property to pre-loss condition'
      });
    }
    
    // Check for quantity reduction >20%
    if (carrier.quantity < contractor.quantity * 0.8) {
      const quantityReduction = ((contractor.quantity - carrier.quantity) / contractor.quantity) * 100;
      tactics.push({
        type: 'quantity_reduction',
        severity: 'high',
        description: contractor.description,
        contractor_quantity: contractor.quantity,
        carrier_quantity: carrier.quantity,
        reduction_percent: quantityReduction,
        reduction_amount: contractor.total - carrier.total,
        message: `Carrier reduced quantity by ${quantityReduction.toFixed(1)}%`,
        recommendation: 'Provide measurements and documentation supporting contractor quantity',
        policy_basis: 'Carrier must justify quantity reductions with evidence'
      });
    }
  }
  
  // Check for missing items (scope omissions)
  const missingItems = contractorItems.filter(contractor => {
    return !matchedPairs.some(pair => pair.contractor_line_id === contractor.id);
  });
  
  for (const item of missingItems) {
    if (item.total > 500) {
      tactics.push({
        type: 'scope_omission',
        severity: 'critical',
        description: item.description,
        contractor_total: item.total,
        carrier_total: 0,
        reduction_amount: item.total,
        message: 'Item completely omitted from carrier estimate',
        recommendation: 'Challenge omission. Provide photos, measurements, and contractor justification.',
        policy_basis: 'All damage caused by covered peril must be included in settlement'
      });
    }
  }
  
  return tactics;
}

/**
 * Detect material downgrade tactics
 */
function detectMaterialDowngrade(contractorItems, carrierItems, matchedPairs) {
  const tactics = [];
  
  const downgradeKeywords = [
    { contractor: ['premium', 'high-grade', 'architectural'], carrier: ['standard', 'basic', 'builder grade'] },
    { contractor: ['hardwood', 'solid wood'], carrier: ['laminate', 'vinyl', 'engineered'] },
    { contractor: ['fiber cement', 'hardie'], carrier: ['vinyl', 'composite'] },
    { contractor: ['copper', 'pex-a'], carrier: ['pex-b', 'cpvc'] }
  ];
  
  for (const pair of matchedPairs) {
    const contractor = contractorItems.find(i => i.id === pair.contractor_line_id);
    const carrier = carrierItems.find(i => i.id === pair.carrier_line_id);
    
    if (!contractor || !carrier) continue;
    
    const contractorDesc = contractor.description.toLowerCase();
    const carrierDesc = carrier.description.toLowerCase();
    
    // Check for material downgrade patterns
    for (const pattern of downgradeKeywords) {
      const hasContractorKeyword = pattern.contractor.some(kw => contractorDesc.includes(kw));
      const hasCarrierKeyword = pattern.carrier.some(kw => carrierDesc.includes(kw));
      
      if (hasContractorKeyword && hasCarrierKeyword) {
        tactics.push({
          type: 'material_downgrade',
          severity: 'high',
          description: contractor.description,
          contractor_material: pattern.contractor.find(kw => contractorDesc.includes(kw)),
          carrier_material: pattern.carrier.find(kw => carrierDesc.includes(kw)),
          contractor_total: contractor.total,
          carrier_total: carrier.total,
          reduction_amount: contractor.total - carrier.total,
          message: 'Carrier substituted lower-grade material',
          recommendation: 'Invoke like-kind-and-quality requirement. Policy requires matching pre-loss material quality.',
          policy_basis: 'Policy requires like-kind-and-quality replacement, not functional equivalency'
        });
      }
    }
    
    // Check for price reduction >15% with same description (hidden downgrade)
    if (Math.abs(contractor.unit_price - carrier.unit_price) / contractor.unit_price > 0.15) {
      const priceReduction = ((contractor.unit_price - carrier.unit_price) / contractor.unit_price) * 100;
      if (priceReduction > 15) {
        tactics.push({
          type: 'hidden_material_downgrade',
          severity: 'medium',
          description: contractor.description,
          contractor_unit_price: contractor.unit_price,
          carrier_unit_price: carrier.unit_price,
          price_reduction_percent: priceReduction,
          reduction_amount: (contractor.unit_price - carrier.unit_price) * carrier.quantity,
          message: `Carrier reduced unit price by ${priceReduction.toFixed(1)}% without specification change`,
          recommendation: 'Request carrier specify exact material/brand. Likely hidden downgrade.',
          policy_basis: 'Carrier must disclose material specifications and justify pricing'
        });
      }
    }
  }
  
  return tactics;
}

/**
 * Detect labor rate suppression
 */
function detectLaborSuppression(contractorItems, carrierItems, matchedPairs, state = null) {
  const tactics = [];
  
  // Identify labor items
  const laborKeywords = ['labor', 'install', 'installation', 'removal', 'demolition'];
  
  for (const pair of matchedPairs) {
    const contractor = contractorItems.find(i => i.id === pair.contractor_line_id);
    const carrier = carrierItems.find(i => i.id === pair.carrier_line_id);
    
    if (!contractor || !carrier) continue;
    
    const isLabor = laborKeywords.some(kw => contractor.description.toLowerCase().includes(kw));
    if (!isLabor) continue;
    
    // Check for significant labor rate reduction
    if (contractor.unit === 'HR' && carrier.unit === 'HR') {
      const rateReduction = ((contractor.unit_price - carrier.unit_price) / contractor.unit_price) * 100;
      
      if (rateReduction > 20) {
        tactics.push({
          type: 'labor_rate_suppression',
          severity: 'high',
          description: contractor.description,
          contractor_rate: contractor.unit_price,
          carrier_rate: carrier.unit_price,
          rate_reduction_percent: rateReduction,
          reduction_amount: (contractor.unit_price - carrier.unit_price) * carrier.quantity,
          message: `Carrier reduced labor rate by ${rateReduction.toFixed(1)}%`,
          recommendation: 'Challenge labor rate. Request carrier provide prevailing wage documentation.',
          policy_basis: 'Labor rates must reflect prevailing local market rates for licensed contractors'
        });
      }
    }
    
    // Check for helper rate vs journeyman rate
    const contractorDesc = contractor.description.toLowerCase();
    const carrierDesc = carrier.description.toLowerCase();
    
    if (!contractorDesc.includes('helper') && carrierDesc.includes('helper')) {
      tactics.push({
        type: 'helper_rate_downgrade',
        severity: 'critical',
        description: contractor.description,
        contractor_description: contractor.description,
        carrier_description: carrier.description,
        reduction_amount: contractor.total - carrier.total,
        message: 'Carrier changed skilled labor to helper rate',
        recommendation: 'Challenge labor classification. Work requires licensed tradesperson, not helper.',
        policy_basis: 'Policy requires qualified contractors. Helper rates are inappropriate for licensed work.'
      });
    }
  }
  
  return tactics;
}

/**
 * Detect code upgrade denial tactics
 */
function detectCodeUpgradeDenial(contractorItems, carrierItems, policyData) {
  const tactics = [];
  
  // Check if policy has ordinance & law coverage
  const hasOrdinanceCoverage = policyData.ordinance_law_percent > 0 || policyData.ordinance_law_limit > 0;
  
  if (!hasOrdinanceCoverage) {
    return tactics;
  }
  
  // Identify code upgrade items in contractor estimate
  const codeKeywords = ['code', 'ordinance', 'upgrade', 'bring to code', 'current code', 'building code'];
  const codeItems = contractorItems.filter(item => 
    codeKeywords.some(kw => item.description.toLowerCase().includes(kw))
  );
  
  for (const codeItem of codeItems) {
    // Check if item is missing from carrier estimate
    const hasCarrierMatch = carrierItems.some(carrier => 
      carrier.description.toLowerCase().includes('code') ||
      carrier.description.toLowerCase().includes('ordinance')
    );
    
    if (!hasCarrierMatch) {
      tactics.push({
        type: 'code_upgrade_denial',
        severity: 'critical',
        description: codeItem.description,
        contractor_total: codeItem.total,
        carrier_total: 0,
        ordinance_coverage: policyData.ordinance_law_percent || policyData.ordinance_law_limit,
        message: 'Carrier omitted code upgrade items despite ordinance & law coverage',
        recommendation: 'Invoke ordinance & law coverage. Obtain building department documentation of code requirements.',
        policy_basis: `Policy provides ${policyData.ordinance_law_percent}% ordinance & law coverage`,
        recovery_amount: codeItem.total
      });
    }
  }
  
  // Check for betterment claims on code upgrades
  const bettermentItems = carrierItems.filter(item => 
    item.description.toLowerCase().includes('betterment')
  );
  
  for (const item of bettermentItems) {
    tactics.push({
      type: 'betterment_on_code_upgrade',
      severity: 'high',
      description: item.description,
      message: 'Carrier claiming betterment on code-required upgrade',
      recommendation: 'Challenge betterment claim. Code upgrades are required by law, not elective improvements.',
      policy_basis: 'Ordinance & law coverage specifically covers code-mandated upgrades',
      recovery_amount: null
    });
  }
  
  return tactics;
}

/**
 * Detect matching endorsement violations
 */
function detectMatchingViolations(contractorItems, carrierItems, policyData) {
  const tactics = [];
  
  if (!policyData.matching_endorsement) {
    return tactics;
  }
  
  // Identify matching-related items
  const matchingKeywords = ['match', 'blend', 'adjacent', 'surrounding', 'entire', 'whole'];
  const matchingItems = contractorItems.filter(item => 
    matchingKeywords.some(kw => item.description.toLowerCase().includes(kw))
  );
  
  for (const item of matchingItems) {
    // Check if carrier reduced or omitted matching scope
    const carrierMatch = carrierItems.find(c => 
      c.description.toLowerCase().includes(item.description.toLowerCase().split(' ')[0])
    );
    
    if (!carrierMatch) {
      tactics.push({
        type: 'matching_endorsement_violation',
        severity: 'critical',
        description: item.description,
        contractor_total: item.total,
        carrier_total: 0,
        message: 'Carrier omitted matching scope despite matching endorsement',
        recommendation: 'Invoke matching endorsement. Carrier must cover cost to match undamaged portions.',
        policy_basis: 'Matching endorsement requires carrier to cover matching costs',
        recovery_amount: item.total
      });
    } else if (carrierMatch.total < item.total * 0.7) {
      tactics.push({
        type: 'matching_scope_reduction',
        severity: 'high',
        description: item.description,
        contractor_total: item.total,
        carrier_total: carrierMatch.total,
        reduction_amount: item.total - carrierMatch.total,
        message: 'Carrier reduced matching scope despite matching endorsement',
        recommendation: 'Challenge scope reduction. Matching endorsement requires full matching costs.',
        policy_basis: 'Matching endorsement requires carrier to cover matching costs',
        recovery_amount: item.total - carrierMatch.total
      });
    }
  }
  
  return tactics;
}

/**
 * Detect causation challenge tactics
 */
function detectCausationChallenges(carrierItems, discrepancies) {
  const tactics = [];
  
  const causationKeywords = ['pre-existing', 'maintenance', 'wear', 'gradual', 'unrelated', 'not caused'];
  
  for (const item of carrierItems) {
    const description = item.description.toLowerCase();
    const hasCausationLanguage = causationKeywords.some(kw => description.includes(kw));
    
    if (hasCausationLanguage) {
      tactics.push({
        type: 'causation_challenge',
        severity: 'high',
        description: item.description,
        carrier_position: 'Challenging causation',
        message: 'Carrier challenging whether damage was caused by covered peril',
        recommendation: 'Provide evidence of causation: photos, expert opinion, timeline documentation',
        policy_basis: 'Carrier bears burden of proof to deny coverage based on causation',
        recovery_amount: null
      });
    }
  }
  
  return tactics;
}

/**
 * Detect O&P (Overhead & Profit) suppression
 */
function detectOPSuppression(contractorOPData, carrierOPData) {
  const tactics = [];
  
  if (!contractorOPData || !carrierOPData) {
    return tactics;
  }
  
  // Check if carrier omitted O&P entirely
  if (contractorOPData.has_op && !carrierOPData.has_op) {
    tactics.push({
      type: 'op_omission',
      severity: 'critical',
      message: 'Carrier omitted Overhead & Profit entirely',
      contractor_op: contractorOPData.op_amount,
      carrier_op: 0,
      reduction_amount: contractorOPData.op_amount,
      recommendation: 'Invoke O&P requirement. Multi-trade repairs require general contractor coordination.',
      policy_basis: 'O&P is recoverable when multiple trades are involved or general contractor is required',
      recovery_amount: contractorOPData.op_amount
    });
  }
  
  // Check if carrier reduced O&P percentage
  if (contractorOPData.has_op && carrierOPData.has_op) {
    const opGap = contractorOPData.op_percent - carrierOPData.op_percent;
    
    if (opGap > 3) {
      tactics.push({
        type: 'op_rate_suppression',
        severity: 'high',
        message: `Carrier reduced O&P from ${contractorOPData.op_percent}% to ${carrierOPData.op_percent}%`,
        contractor_op_percent: contractorOPData.op_percent,
        carrier_op_percent: carrierOPData.op_percent,
        contractor_op_amount: contractorOPData.op_amount,
        carrier_op_amount: carrierOPData.op_amount,
        reduction_amount: contractorOPData.op_amount - carrierOPData.op_amount,
        recommendation: 'Challenge O&P reduction. Standard O&P is 10% overhead + 10% profit = 20% total.',
        policy_basis: 'Industry standard O&P rates apply when general contractor is required',
        recovery_amount: contractorOPData.op_amount - carrierOPData.op_amount
      });
    }
  }
  
  return tactics;
}

/**
 * Detect pattern of systematic underpayment
 */
function detectSystematicUnderpayment(discrepancies, categoryBreakdown) {
  const tactics = [];
  
  // Check if carrier is consistently low across multiple categories
  const categoriesWithUnderpayment = Object.entries(categoryBreakdown)
    .filter(([cat, data]) => data.underpayment > 0 && data.underpayment_percent > 15);
  
  if (categoriesWithUnderpayment.length >= 3) {
    const totalUnderpayment = categoriesWithUnderpayment.reduce((sum, [cat, data]) => sum + data.underpayment, 0);
    
    tactics.push({
      type: 'systematic_underpayment',
      severity: 'critical',
      affected_categories: categoriesWithUnderpayment.map(([cat]) => cat),
      total_underpayment: totalUnderpayment,
      message: `Carrier systematically underpaying across ${categoriesWithUnderpayment.length} categories`,
      recommendation: 'Document pattern of underpayment. Consider filing bad faith complaint if pattern persists.',
      policy_basis: 'Systematic underpayment may constitute bad faith claims handling',
      recovery_amount: totalUnderpayment
    });
  }
  
  return tactics;
}

/**
 * AI-powered tactic detection for complex patterns
 */
async function aiTacticDetection(contractorItems, carrierItems, discrepancies, policyData) {
  const prompt = `You are an insurance bad faith expert. Analyze the following estimate comparison for carrier tactics designed to reduce claim payment.

Policy Type: ${policyData.settlement_type}
Policy Coverage: Dwelling $${policyData.dwelling_limit}, Deductible $${policyData.deductible}

Contractor Total: $${contractorItems.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
Carrier Total: $${carrierItems.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
Difference: $${(contractorItems.reduce((sum, i) => sum + i.total, 0) - carrierItems.reduce((sum, i) => sum + i.total, 0)).toFixed(2)}

Key Discrepancies:
${discrepancies.slice(0, 15).map((d, idx) => 
  `${idx + 1}. ${d.discrepancy_type}: ${d.line_item_description} - Contractor: $${d.contractor_total}, Carrier: $${d.carrier_total}`
).join('\n')}

Identify carrier tactics:
1. Scope reduction patterns
2. Material downgrades
3. Labor rate suppression
4. Code upgrade denials
5. Improper depreciation
6. Causation challenges
7. Coverage limitation abuse
8. Systematic underpayment patterns

Return JSON with format:
{
  "tactics_detected": [
    {
      "tactic_type": string,
      "severity": "critical" | "high" | "medium",
      "description": string,
      "evidence": string,
      "recovery_amount": number,
      "recommendation": string,
      "legal_basis": string
    }
  ],
  "overall_pattern": string,
  "bad_faith_indicators": [string],
  "recommended_actions": [string]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an insurance bad faith expert specializing in detecting carrier tactics to reduce claim payments.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const response = JSON.parse(completion.choices[0].message.content);
    
    return {
      tactics: response.tactics_detected || [],
      overall_pattern: response.overall_pattern || '',
      bad_faith_indicators: response.bad_faith_indicators || [],
      recommended_actions: response.recommended_actions || [],
      ai_model: 'gpt-4-turbo-preview',
      ai_confidence: 0.75
    };
  } catch (error) {
    console.error('AI tactic detection error:', error);
    return null;
  }
}

/**
 * Generate carrier tactics report
 */
function generateTacticsReport(allTactics, aiAnalysis) {
  const report = {
    summary: {
      total_tactics_detected: allTactics.length,
      critical_tactics: allTactics.filter(t => t.severity === 'critical').length,
      high_priority_tactics: allTactics.filter(t => t.severity === 'high').length,
      total_recovery_potential: allTactics.reduce((sum, t) => sum + (t.recovery_amount || 0), 0),
      tactic_types: {}
    },
    tactics_by_type: {},
    critical_findings: allTactics.filter(t => t.severity === 'critical'),
    high_priority_findings: allTactics.filter(t => t.severity === 'high'),
    recommendations: [],
    ai_analysis: aiAnalysis
  };
  
  // Group tactics by type
  for (const tactic of allTactics) {
    if (!report.tactics_by_type[tactic.type]) {
      report.tactics_by_type[tactic.type] = [];
    }
    report.tactics_by_type[tactic.type].push(tactic);
    
    // Count by type
    report.summary.tactic_types[tactic.type] = (report.summary.tactic_types[tactic.type] || 0) + 1;
  }
  
  // Generate recommendations
  if (report.summary.critical_tactics > 0) {
    report.recommendations.push({
      priority: 'critical',
      category: 'carrier_tactics',
      title: 'Critical Carrier Tactics Detected',
      description: `${report.summary.critical_tactics} critical carrier tactics identified`,
      action: 'Submit formal objection with detailed documentation of each tactic',
      estimated_recovery: allTactics
        .filter(t => t.severity === 'critical')
        .reduce((sum, t) => sum + (t.recovery_amount || 0), 0)
    });
  }
  
  if (report.summary.tactic_types['systematic_underpayment']) {
    report.recommendations.push({
      priority: 'critical',
      category: 'bad_faith',
      title: 'Systematic Underpayment Pattern',
      description: 'Pattern of carrier tactics suggests potential bad faith claims handling',
      action: 'Document all tactics. Consider consulting attorney for bad faith evaluation.',
      estimated_recovery: null
    });
  }
  
  if (report.summary.tactic_types['scope_omission'] >= 3) {
    report.recommendations.push({
      priority: 'high',
      category: 'scope_dispute',
      title: 'Multiple Scope Omissions',
      description: `Carrier omitted ${report.summary.tactic_types['scope_omission']} items from estimate`,
      action: 'Submit detailed supplement with photos, measurements, and contractor justification for each omitted item',
      estimated_recovery: allTactics
        .filter(t => t.type === 'scope_omission')
        .reduce((sum, t) => sum + (t.recovery_amount || 0), 0)
    });
  }
  
  return report;
}

/**
 * Main carrier tactic detection function
 */
async function detectCarrierTactics(contractorItems, carrierItems, matchedPairs, discrepancies, policyData, categoryBreakdown, opAnalysis) {
  console.log('[Carrier Tactic Detector] Starting analysis...');
  
  const allTactics = [];
  
  // Detect scope reduction
  const scopeTactics = detectScopeReduction(contractorItems, carrierItems, matchedPairs);
  allTactics.push(...scopeTactics);
  
  // Detect material downgrades
  const materialTactics = detectMaterialDowngrade(contractorItems, carrierItems, matchedPairs);
  allTactics.push(...materialTactics);
  
  // Detect labor suppression
  const laborTactics = detectLaborSuppression(contractorItems, carrierItems, matchedPairs, policyData.state);
  allTactics.push(...laborTactics);
  
  // Detect code upgrade denial
  const codeTactics = detectCodeUpgradeDenial(contractorItems, carrierItems, policyData);
  allTactics.push(...codeTactics);
  
  // Detect matching violations
  const matchingTactics = detectMatchingViolations(contractorItems, carrierItems, policyData);
  allTactics.push(...matchingTactics);
  
  // Detect O&P suppression
  const opTactics = detectOPSuppression(opAnalysis?.contractor, opAnalysis?.carrier);
  allTactics.push(...opTactics);
  
  // Detect systematic underpayment
  const systematicTactics = detectSystematicUnderpayment(discrepancies, categoryBreakdown);
  allTactics.push(...systematicTactics);
  
  // Detect causation challenges
  const causationTactics = detectCausationChallenges(carrierItems, discrepancies);
  allTactics.push(...causationTactics);
  
  // AI analysis for complex patterns
  const aiAnalysis = await aiTacticDetection(contractorItems, carrierItems, discrepancies, policyData);
  
  // Generate comprehensive report
  const report = generateTacticsReport(allTactics, aiAnalysis);
  
  console.log(`[Carrier Tactic Detector] Complete. Found ${allTactics.length} tactics, potential recovery: $${report.summary.total_recovery_potential.toFixed(2)}`);
  
  return report;
}

module.exports = {
  detectCarrierTactics,
  detectScopeReduction,
  detectMaterialDowngrade,
  detectLaborSuppression,
  detectCodeUpgradeDenial,
  detectMatchingViolations,
  detectCausationChallenges,
  detectOPSuppression,
  detectSystematicUnderpayment,
  aiTacticDetection,
  CARRIER_TACTICS
};

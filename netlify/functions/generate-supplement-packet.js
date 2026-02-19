/**
 * Automated Supplement Packet Generator
 * Generates structured supplement packets from enforcement layer outputs
 * 
 * AI used ONLY for narrative drafting - never for financial calculations
 */

const { createClient } = require('@supabase/supabase-js');
const { sendError, sendSuccess, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const startTime = Date.now();
  let userId = null;

  try {
    // CORS headers
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
      };
    }

    // Verify authentication
    const authResult = await validateAuth(event.headers.authorization);
    if (!authResult.valid) {
      return sendError(authResult.error, 'AUTH-001', 401);
    }
    userId = authResult.user.id;

    // Parse request body
    const body = parseBody(event.body);
    const claim_id = body.claim_id;
    const format = body.format || 'json';
    
    if (!claim_id) {
      return sendError('claim_id is required', 'VAL-001', 400);
    }
    
    if (!['json', 'html', 'pdf-ready', 'supplement-ready'].includes(format)) {
      return sendError('Invalid format. Must be: json, html, pdf-ready, or supplement-ready', 'VAL-002', 400);
    }

    // Validate claim ownership
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id, claim_number')
      .eq('id', claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    console.log(`[Supplement Packet] Generating for claim ${claim.claim_number}`);

    // =====================================================
    // RETRIEVE DATA FROM DATABASE
    // =====================================================
    
    // Get financial exposure report
    const { data: exposure, error: exposureError } = await supabase
      .from('claim_financial_exposure_reports')
      .select('*')
      .eq('claim_id', claim_id)
      .single();

    if (exposureError || !exposure) {
      return sendError('Financial exposure report not found. Run estimate analysis first.', 'REPORT-001', 404);
    }

    // Get enforcement report
    const { data: enforcement, error: enforcementError } = await supabase
      .from('claim_enforcement_reports')
      .select('*')
      .eq('claim_id', claim_id)
      .single();

    const codeUpgrades = enforcement ? {
      totalCodeUpgradeExposure: enforcement.code_upgrade_exposure,
      flagCount: enforcement.code_upgrade_flag_count,
      codeUpgradeFlags: enforcement.code_upgrade_flags
    } : {};

    const coverageConflicts = enforcement ? {
      coverageExposureAdjustments: enforcement.coverage_adjustment_exposure,
      conflictCount: enforcement.coverage_conflict_count,
      coverageConflicts: enforcement.coverage_conflicts
    } : {};

    const patternFlags = enforcement ? {
      patternFlags: enforcement.carrier_pattern_flags
    } : {};

    // =====================================================
    // GENERATE SUPPLEMENT PACKET
    // =====================================================
    const supplementPacket = generateSupplementPacket({
      claimId: claim_id,
      exposure: {
        totalProjectedRecovery: exposure.total_projected_recovery,
        rcvDeltaTotal: exposure.rcv_delta_total,
        acvDeltaTotal: exposure.acv_delta_total,
        recoverableDepreciationTotal: exposure.recoverable_depreciation_total,
        opExposure: {
          qualifiesForOP: exposure.op_qualifies,
          opAmount: exposure.op_amount,
          tradesDetected: exposure.op_trades_detected,
          tradeCount: exposure.op_trade_count,
          reason: exposure.op_reason,
          calculation: exposure.op_calculation
        },
        categoryBreakdown: exposure.category_breakdown,
        structuredLineItemDeltas: exposure.structured_line_item_deltas
      },
      codeUpgrades: codeUpgrades,
      coverageConflicts: coverageConflicts,
      patternFlags: patternFlags,
      reconciliation: {}
    });

    // =====================================================
    // FORMAT OUTPUT
    // =====================================================
    let formattedOutput;
    
    switch (format) {
      case 'html':
        formattedOutput = formatAsHTML(supplementPacket);
        break;
      case 'pdf-ready':
        formattedOutput = formatAsPDFReady(supplementPacket);
        break;
      case 'supplement-ready':
        formattedOutput = formatAsSupplementReady(supplementPacket);
        break;
      default:
        formattedOutput = supplementPacket;
    }

    // =====================================================
    // STORE IN DATABASE
    // =====================================================
    const { data: stored, error: storeError } = await supabase
      .from('claim_supplement_packets')
      .upsert({
        claim_id: claim_id,
        user_id: userId,
        supplement_packet: supplementPacket,
        total_supplement_request: supplementPacket.totalSupplementRequest,
        generated_at: new Date().toISOString(),
        format: format
      }, {
        onConflict: 'claim_id'
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing supplement packet:', storeError);
    }

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/generate-supplement-packet',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Supplement Packet] Generation complete in ${Date.now() - startTime}ms`);

    return sendSuccess({
      supplement_packet: formattedOutput,
      total_supplement_request: supplementPacket.totalSupplementRequest,
      format: format,
      stored: !!stored
    });

  } catch (error) {
    console.error('[Supplement Packet] Generation error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/generate-supplement-packet',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Supplement packet generation failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

/**
 * Generate structured supplement packet
 */
function generateSupplementPacket(params) {
  const {
    claimId,
    exposure,
    codeUpgrades,
    coverageConflicts,
    patternFlags,
    reconciliation
  } = params;

  // =====================================================
  // CALCULATE TOTAL SUPPLEMENT REQUEST
  // =====================================================
  const totalSupplementRequest = calculateTotalSupplementRequest(
    exposure,
    codeUpgrades,
    coverageConflicts
  );

  // =====================================================
  // EXECUTIVE SUMMARY
  // =====================================================
  const executiveSummary = generateExecutiveSummary(
    totalSupplementRequest,
    exposure,
    codeUpgrades,
    coverageConflicts
  );

  // =====================================================
  // FINANCIAL BREAKDOWN
  // =====================================================
  const financialBreakdown = generateFinancialBreakdown(
    exposure,
    codeUpgrades,
    coverageConflicts
  );

  // =====================================================
  // CATEGORY EXPOSURE TABLE
  // =====================================================
  const categoryExposureTable = generateCategoryExposureTable(
    exposure.categoryBreakdown || []
  );

  // =====================================================
  // O&P JUSTIFICATION
  // =====================================================
  const oAndPJustification = generateOPJustification(
    exposure.opExposure || {}
  );

  // =====================================================
  // CODE UPGRADE JUSTIFICATION
  // =====================================================
  const codeUpgradeJustification = generateCodeUpgradeJustification(
    codeUpgrades.codeUpgradeFlags || []
  );

  // =====================================================
  // POLICY CONFLICT SECTION
  // =====================================================
  const policyConflictSection = generatePolicyConflictSection(
    coverageConflicts.coverageConflicts || []
  );

  // =====================================================
  // CARRIER PATTERN SECTION
  // =====================================================
  const carrierPatternSection = generateCarrierPatternSection(
    patternFlags.patternFlags || []
  );

  // =====================================================
  // STRUCTURED LINE ITEM APPENDIX
  // =====================================================
  const structuredLineItemAppendix = generateLineItemAppendix(
    exposure.structuredLineItemDeltas || []
  );

  return {
    claimId: claimId,
    generatedAt: new Date().toISOString(),
    totalSupplementRequest: totalSupplementRequest,
    executiveSummary: executiveSummary,
    financialBreakdown: financialBreakdown,
    categoryExposureTable: categoryExposureTable,
    oAndPJustification: oAndPJustification,
    codeUpgradeJustification: codeUpgradeJustification,
    policyConflictSection: policyConflictSection,
    carrierPatternSection: carrierPatternSection,
    structuredLineItemAppendix: structuredLineItemAppendix,
    metadata: {
      engine_version: '1.0',
      calculation_method: 'deterministic'
    }
  };
}

/**
 * Calculate total supplement request
 * DETERMINISTIC - No AI
 */
function calculateTotalSupplementRequest(exposure, codeUpgrades, coverageConflicts) {
  const baseRecovery = exposure.totalProjectedRecovery || 0;
  const codeUpgradeExposure = codeUpgrades.totalCodeUpgradeExposure || 0;
  const coverageAdjustments = coverageConflicts.coverageExposureAdjustments || 0;

  const total = baseRecovery + codeUpgradeExposure + coverageAdjustments;

  return parseFloat(total.toFixed(2));
}

/**
 * Generate executive summary
 * AI may be used for narrative drafting - numbers are deterministic
 */
function generateExecutiveSummary(totalSupplementRequest, exposure, codeUpgrades, coverageConflicts) {
  const rcvDelta = exposure.rcvDeltaTotal || 0;
  const opAmount = exposure.opExposure?.opAmount || 0;
  const codeUpgradeTotal = codeUpgrades.totalCodeUpgradeExposure || 0;
  const coverageAdjustments = coverageConflicts.coverageExposureAdjustments || 0;

  return {
    totalSupplementRequest: totalSupplementRequest,
    summary: `This supplement request totals ${formatCurrency(totalSupplementRequest)} based on deterministic analysis of estimate discrepancies, code compliance requirements, and policy coverage provisions.`,
    keyFindings: [
      `Estimate Discrepancy: ${formatCurrency(rcvDelta)} in underpaid line items`,
      opAmount > 0 ? `Overhead & Profit: ${formatCurrency(opAmount)} (multi-trade project)` : null,
      codeUpgradeTotal > 0 ? `Code Upgrades: ${formatCurrency(codeUpgradeTotal)} (${codeUpgrades.flagCount} requirements)` : null,
      coverageAdjustments !== 0 ? `Coverage Adjustments: ${formatCurrency(coverageAdjustments)} (${coverageConflicts.conflictCount} conflicts)` : null
    ].filter(Boolean),
    recommendation: 'Approve supplement request in full. All amounts are supported by deterministic calculations, code requirements, and policy provisions.'
  };
}

/**
 * Generate financial breakdown
 */
function generateFinancialBreakdown(exposure, codeUpgrades, coverageConflicts) {
  return {
    baseExposure: {
      rcvDelta: exposure.rcvDeltaTotal || 0,
      acvDelta: exposure.acvDeltaTotal || 0,
      depreciation: exposure.recoverableDepreciationTotal || 0,
      opExposure: exposure.opExposure?.opAmount || 0,
      subtotal: exposure.totalProjectedRecovery || 0
    },
    codeUpgrades: {
      total: codeUpgrades.totalCodeUpgradeExposure || 0,
      flagCount: codeUpgrades.flagCount || 0,
      flags: codeUpgrades.codeUpgradeFlags || []
    },
    coverageAdjustments: {
      total: coverageConflicts.coverageExposureAdjustments || 0,
      conflictCount: coverageConflicts.conflictCount || 0,
      conflicts: coverageConflicts.coverageConflicts || []
    },
    grandTotal: calculateTotalSupplementRequest(exposure, codeUpgrades, coverageConflicts)
  };
}

/**
 * Generate category exposure table
 */
function generateCategoryExposureTable(categoryBreakdown) {
  return categoryBreakdown.map(cat => ({
    category: cat.category,
    contractorTotal: cat.contractorTotal || 0,
    carrierTotal: cat.carrierTotal || 0,
    rcvDelta: cat.rcvDelta || 0,
    acvDelta: cat.acvDelta || 0,
    percentUnderpaid: cat.percentUnderpaid || 0
  }));
}

/**
 * Generate O&P justification
 */
function generateOPJustification(opExposure) {
  if (!opExposure.qualifiesForOP) {
    return {
      qualifies: false,
      reason: 'Project does not meet multi-trade threshold for O&P'
    };
  }

  return {
    qualifies: true,
    amount: opExposure.opAmount || 0,
    tradesDetected: opExposure.tradesDetected || [],
    tradeCount: opExposure.tradeCount || 0,
    reason: opExposure.reason || '',
    justification: `This project involves ${opExposure.tradeCount} distinct trades: ${(opExposure.tradesDetected || []).join(', ')}. Industry standard and legal precedent support 20% O&P (10% overhead + 10% profit) for multi-trade projects requiring coordination.`,
    calculation: opExposure.calculation || {}
  };
}

/**
 * Generate code upgrade justification
 */
function generateCodeUpgradeJustification(codeUpgradeFlags) {
  if (codeUpgradeFlags.length === 0) {
    return {
      hasUpgrades: false,
      message: 'No code upgrade requirements detected'
    };
  }

  return {
    hasUpgrades: true,
    totalExposure: codeUpgradeFlags.reduce((sum, flag) => sum + (flag.estimatedCostImpact || 0), 0),
    flagCount: codeUpgradeFlags.length,
    flags: codeUpgradeFlags.map(flag => ({
      issue: flag.issue,
      priority: flag.priority,
      explanation: flag.explanation,
      estimatedCost: flag.estimatedCostImpact,
      calculation: flag.calculation
    })),
    justification: `Building code compliance requires ${codeUpgradeFlags.length} upgrade(s). These are mandatory requirements, not optional enhancements. Failure to comply would result in permit rejection.`
  };
}

/**
 * Generate policy conflict section
 */
function generatePolicyConflictSection(coverageConflicts) {
  if (coverageConflicts.length === 0) {
    return {
      hasConflicts: false,
      message: 'No policy coverage conflicts detected'
    };
  }

  return {
    hasConflicts: true,
    conflictCount: coverageConflicts.length,
    conflicts: coverageConflicts.map(conflict => ({
      issue: conflict.issue,
      category: conflict.category,
      priority: conflict.priority,
      explanation: conflict.explanation,
      exposureAdjustment: conflict.exposureAdjustment || 0
    })),
    summary: `${coverageConflicts.length} policy coverage conflict(s) detected. Carrier estimate does not align with policy provisions.`
  };
}

/**
 * Generate carrier pattern section
 */
function generateCarrierPatternSection(patternFlags) {
  if (patternFlags.length === 0) {
    return {
      hasPatterns: false,
      message: 'No systemic carrier patterns detected'
    };
  }

  return {
    hasPatterns: true,
    patternCount: patternFlags.length,
    patterns: patternFlags.map(pattern => ({
      pattern: pattern.pattern,
      category: pattern.category,
      confidence: pattern.confidence,
      explanation: pattern.explanation,
      severity: pattern.severity
    })),
    summary: `${patternFlags.length} systemic carrier pattern(s) detected. This information provides negotiation leverage.`
  };
}

/**
 * Generate line item appendix
 */
function generateLineItemAppendix(structuredLineItemDeltas) {
  return structuredLineItemDeltas.map(item => ({
    description: item.description,
    category: item.category,
    carrierQty: item.carrierQty || 0,
    contractorQty: item.contractorQty || 0,
    carrierUnitPrice: item.carrierUnitPrice || 0,
    contractorUnitPrice: item.contractorUnitPrice || 0,
    rcvDelta: item.rcvDelta || 0,
    acvDelta: item.acvDelta || 0,
    discrepancyType: item.discrepancyType
  }));
}

/**
 * Format as HTML
 */
function formatAsHTML(supplementPacket) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Supplement Request - Claim ${supplementPacket.claimId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2c3e50; }
    h2 { color: #34495e; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #3498db; color: white; }
    .total { font-size: 24px; font-weight: bold; color: #27ae60; }
    .section { margin: 30px 0; }
  </style>
</head>
<body>
  <h1>Supplement Request</h1>
  <p><strong>Claim ID:</strong> ${supplementPacket.claimId}</p>
  <p><strong>Generated:</strong> ${new Date(supplementPacket.generatedAt).toLocaleString()}</p>
  
  <div class="section">
    <h2>Total Supplement Request</h2>
    <p class="total">${formatCurrency(supplementPacket.totalSupplementRequest)}</p>
  </div>
  
  <div class="section">
    <h2>Executive Summary</h2>
    <p>${supplementPacket.executiveSummary.summary}</p>
    <ul>
      ${supplementPacket.executiveSummary.keyFindings.map(f => `<li>${f}</li>`).join('')}
    </ul>
  </div>
  
  <div class="section">
    <h2>Financial Breakdown</h2>
    <table>
      <tr><th>Component</th><th>Amount</th></tr>
      <tr><td>RCV Delta</td><td>${formatCurrency(supplementPacket.financialBreakdown.baseExposure.rcvDelta)}</td></tr>
      <tr><td>O&P Exposure</td><td>${formatCurrency(supplementPacket.financialBreakdown.baseExposure.opExposure)}</td></tr>
      <tr><td>Code Upgrades</td><td>${formatCurrency(supplementPacket.financialBreakdown.codeUpgrades.total)}</td></tr>
      <tr><td>Coverage Adjustments</td><td>${formatCurrency(supplementPacket.financialBreakdown.coverageAdjustments.total)}</td></tr>
      <tr><th>Grand Total</th><th>${formatCurrency(supplementPacket.financialBreakdown.grandTotal)}</th></tr>
    </table>
  </div>
  
  ${supplementPacket.oAndPJustification.qualifies ? `
  <div class="section">
    <h2>Overhead & Profit Justification</h2>
    <p>${supplementPacket.oAndPJustification.justification}</p>
    <p><strong>Amount:</strong> ${formatCurrency(supplementPacket.oAndPJustification.amount)}</p>
  </div>
  ` : ''}
  
  ${supplementPacket.codeUpgradeJustification.hasUpgrades ? `
  <div class="section">
    <h2>Code Upgrade Requirements</h2>
    <p>${supplementPacket.codeUpgradeJustification.justification}</p>
    <ul>
      ${supplementPacket.codeUpgradeJustification.flags.map(f => 
        `<li><strong>${f.issue}:</strong> ${f.explanation} (${formatCurrency(f.estimatedCost)})</li>`
      ).join('')}
    </ul>
  </div>
  ` : ''}
  
</body>
</html>
  `;
}

/**
 * Format as PDF-ready
 */
function formatAsPDFReady(supplementPacket) {
  return {
    title: `Supplement Request - Claim ${supplementPacket.claimId}`,
    sections: [
      {
        heading: 'Total Supplement Request',
        content: formatCurrency(supplementPacket.totalSupplementRequest),
        style: 'hero'
      },
      {
        heading: 'Executive Summary',
        content: supplementPacket.executiveSummary.summary,
        bullets: supplementPacket.executiveSummary.keyFindings
      },
      {
        heading: 'Financial Breakdown',
        table: {
          headers: ['Component', 'Amount'],
          rows: [
            ['RCV Delta', formatCurrency(supplementPacket.financialBreakdown.baseExposure.rcvDelta)],
            ['O&P Exposure', formatCurrency(supplementPacket.financialBreakdown.baseExposure.opExposure)],
            ['Code Upgrades', formatCurrency(supplementPacket.financialBreakdown.codeUpgrades.total)],
            ['Coverage Adjustments', formatCurrency(supplementPacket.financialBreakdown.coverageAdjustments.total)],
            ['Grand Total', formatCurrency(supplementPacket.financialBreakdown.grandTotal)]
          ]
        }
      }
    ]
  };
}

/**
 * Format as supplement-ready (for Xactimate/other estimating software)
 */
function formatAsSupplementReady(supplementPacket) {
  return {
    claim_id: supplementPacket.claimId,
    supplement_total: supplementPacket.totalSupplementRequest,
    line_items: supplementPacket.structuredLineItemAppendix.map((item, index) => ({
      line_number: index + 1,
      description: item.description,
      category: item.category,
      quantity: item.contractorQty - item.carrierQty,
      unit_price: item.contractorUnitPrice,
      total: item.rcvDelta,
      notes: `Discrepancy Type: ${item.discrepancyType}`
    })),
    notes: supplementPacket.executiveSummary.summary
  };
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

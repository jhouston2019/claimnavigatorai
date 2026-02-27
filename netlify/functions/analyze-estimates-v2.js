/**
 * API Endpoint: /analyze-estimates-v2
 * REAL Estimate Review Pro Engine - Commercial Grade
 * Deterministic parser → matcher → reconciler → AI fallback
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { parseEstimate } = require('./lib/estimate-parser');
const { matchLineItems, semanticMatch } = require('./lib/estimate-matcher');
const { reconcileEstimates, validateReconciliation, generateSummary } = require('./lib/estimate-reconciler');
const { calculateExposure } = require('./lib/financial-exposure-engine');
const { analyzeCodeUpgrades } = require('./lib/code-upgrade-engine');
const { analyzePolicyCrosswalk } = require('./lib/policy-estimate-crosswalk');
const { analyzeCarrierPatterns } = require('./lib/carrier-pattern-engine');
const { validatePricing } = require('./lib/pricing-validation-engine');
const { detectDepreciationAbuse } = require('./lib/depreciation-abuse-detector');
const { detectCarrierTactics } = require('./lib/carrier-tactic-detector');
const { validateEstimateStructure, generateInputQualityReport } = require('./lib/input-validator');
const { analyzeLossExpectation } = require('./lib/loss-expectation-engine');
const { analyzeTradeCompleteness } = require('./lib/trade-completeness-engine');
const { validateLaborRates } = require('./lib/labor-rate-validator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const startTime = Date.now();
  let userId = null;

  try {
    // Handle CORS preflight
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

    // Validate authentication
    const authResult = await validateAuth(event.headers.authorization);
    if (!authResult.valid) {
      return sendError(authResult.error, 'AUTH-001', 401);
    }
    userId = authResult.user.id;

    // Parse and validate request body
    const body = parseBody(event.body);
    
    if (!body.claim_id) {
      return sendError('claim_id is required', 'VAL-001', 400);
    }

    if (!body.contractor_estimate_pdf_url) {
      return sendError('contractor_estimate_pdf_url is required', 'VAL-002', 400);
    }

    if (!body.carrier_estimate_pdf_url) {
      return sendError('carrier_estimate_pdf_url is required', 'VAL-003', 400);
    }

    // Validate claim ownership
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id, claim_number')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    console.log(`[Estimate Engine] Starting analysis for claim ${claim.claim_number}`);

    // =====================================================
    // PHASE 0: INPUT VALIDATION
    // =====================================================
    console.log('[Estimate Engine] Phase 0: Validating input structure...');
    
    // Validate contractor estimate structure (will be done after PDF parsing)
    let contractorValidation, carrierValidation;

    // =====================================================
    // PHASE 1: PARSE CONTRACTOR ESTIMATE
    // =====================================================
    console.log('[Estimate Engine] Phase 1: Parsing contractor estimate...');
    
    let contractorText;
    try {
      const response = await fetch(body.contractor_estimate_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download contractor estimate PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      contractorText = pdfData.text;

      if (!contractorText || contractorText.trim().length < 50) {
        throw new Error('Contractor estimate PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('Contractor PDF parsing error:', pdfError);
      return sendError('Failed to parse contractor estimate PDF', 'PDF-001', 400, {
        details: pdfError.message
      });
    }

    // Validate contractor estimate structure
    contractorValidation = validateEstimateStructure(contractorText);
    if (!contractorValidation.valid) {
      console.warn('[Estimate Engine] Contractor estimate structure validation failed:', contractorValidation.errors);
    }
    
    const contractorParsed = parseEstimate(contractorText, 'contractor');
    console.log(`[Estimate Engine] Parsed ${contractorParsed.lineItems.length} contractor line items`);

    // =====================================================
    // PHASE 2: PARSE CARRIER ESTIMATE
    // =====================================================
    console.log('[Estimate Engine] Phase 2: Parsing carrier estimate...');
    
    let carrierText;
    try {
      const response = await fetch(body.carrier_estimate_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download carrier estimate PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      carrierText = pdfData.text;

      if (!carrierText || carrierText.trim().length < 50) {
        throw new Error('Carrier estimate PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('Carrier PDF parsing error:', pdfError);
      return sendError('Failed to parse carrier estimate PDF', 'PDF-002', 400, {
        details: pdfError.message
      });
    }

    // Validate carrier estimate structure
    carrierValidation = validateEstimateStructure(carrierText);
    if (!carrierValidation.valid) {
      console.warn('[Estimate Engine] Carrier estimate structure validation failed:', carrierValidation.errors);
    }
    
    const carrierParsed = parseEstimate(carrierText, 'carrier');
    console.log(`[Estimate Engine] Parsed ${carrierParsed.lineItems.length} carrier line items`);

    // =====================================================
    // PHASE 3: STORE LINE ITEMS IN DATABASE
    // =====================================================
    console.log('[Estimate Engine] Phase 3: Storing line items...');
    
    // Store contractor line items
    const contractorInserts = contractorParsed.lineItems.map(item => ({
      claim_id: body.claim_id,
      user_id: userId,
      document_id: body.contractor_document_id || null,
      estimate_type: 'contractor',
      ...item
    }));

    const { data: contractorRows, error: contractorError } = await supabase
      .from('claim_estimate_line_items')
      .insert(contractorInserts)
      .select();

    if (contractorError) {
      console.error('Failed to store contractor line items:', contractorError);
      return sendError('Failed to store contractor line items', 'DB-001', 500);
    }

    // Store carrier line items
    const carrierInserts = carrierParsed.lineItems.map(item => ({
      claim_id: body.claim_id,
      user_id: userId,
      document_id: body.carrier_document_id || null,
      estimate_type: 'carrier',
      ...item
    }));

    const { data: carrierRows, error: carrierError } = await supabase
      .from('claim_estimate_line_items')
      .insert(carrierInserts)
      .select();

    if (carrierError) {
      console.error('Failed to store carrier line items:', carrierError);
      return sendError('Failed to store carrier line items', 'DB-002', 500);
    }

    // Add database IDs to parsed items
    contractorParsed.lineItems.forEach((item, i) => {
      item.id = contractorRows[i].id;
    });
    carrierParsed.lineItems.forEach((item, i) => {
      item.id = carrierRows[i].id;
    });

    // Store estimate metadata
    await supabase.from('claim_estimate_metadata').insert([
      {
        claim_id: body.claim_id,
        user_id: userId,
        document_id: body.contractor_document_id,
        estimate_type: 'contractor',
        ...contractorParsed.metadata
      },
      {
        claim_id: body.claim_id,
        user_id: userId,
        document_id: body.carrier_document_id,
        estimate_type: 'carrier',
        ...carrierParsed.metadata
      }
    ]);

    // =====================================================
    // PHASE 4: DETERMINISTIC MATCHING
    // =====================================================
    console.log('[Estimate Engine] Phase 4: Matching line items...');
    
    const matchResult = matchLineItems(
      contractorParsed.lineItems,
      carrierParsed.lineItems
    );

    console.log(`[Estimate Engine] Matched ${matchResult.matches.length} items`);
    console.log(`[Estimate Engine] - Exact: ${matchResult.stats.exact_matches}`);
    console.log(`[Estimate Engine] - Fuzzy: ${matchResult.stats.fuzzy_matches}`);
    console.log(`[Estimate Engine] - Category: ${matchResult.stats.category_matches}`);
    console.log(`[Estimate Engine] Unmatched contractor: ${matchResult.unmatchedContractor.length}`);
    console.log(`[Estimate Engine] Unmatched carrier: ${matchResult.unmatchedCarrier.length}`);

    // =====================================================
    // PHASE 5: AI SEMANTIC MATCHING (FALLBACK ONLY) WITH TRACE LOGGING
    // =====================================================
    let semanticMatches = [];
    let aiDecisionTraces = [];
    
    if (matchResult.unmatchedContractor.length > 0 && matchResult.unmatchedCarrier.length > 0) {
      console.log('[Estimate Engine] Phase 5: AI semantic matching for unmatched items...');
      
      try {
        const semanticResult = await semanticMatch(
          matchResult.unmatchedContractor,
          matchResult.unmatchedCarrier,
          openai
        );
        
        semanticMatches = semanticResult.matches || [];
        aiDecisionTraces = semanticResult.traces || [];
        
        console.log(`[Estimate Engine] AI matched ${semanticMatches.length} additional items`);
        console.log(`[Estimate Engine] AI decision traces: ${aiDecisionTraces.length}`);
        
        // Add semantic matches to main matches
        matchResult.matches.push(...semanticMatches);
        
        // Remove semantically matched items from unmatched lists
        for (const match of semanticMatches) {
          const cIndex = matchResult.unmatchedContractor.findIndex(i => i.id === match.contractor.id);
          if (cIndex !== -1) matchResult.unmatchedContractor.splice(cIndex, 1);
          
          const caIndex = matchResult.unmatchedCarrier.findIndex(i => i.id === match.carrier.id);
          if (caIndex !== -1) matchResult.unmatchedCarrier.splice(caIndex, 1);
        }
        
        // Store AI decision traces in database for audit
        if (aiDecisionTraces.length > 0) {
          await supabase.from('claim_ai_decision_traces').insert(
            aiDecisionTraces.map(trace => ({
              claim_id: body.claim_id,
              user_id: userId,
              ...trace
            }))
          );
        }
      } catch (aiError) {
        console.error('AI semantic matching failed:', aiError);
        // Continue without semantic matches
      }
    }

    // =====================================================
    // PHASE 6: RECONCILIATION (WITH UNIT NORMALIZATION & O&P)
    // =====================================================
    console.log('[Estimate Engine] Phase 6: Reconciling estimates with unit normalization...');
    
    const reconciliation = reconcileEstimates(
      matchResult.matches,
      matchResult.unmatchedContractor,
      matchResult.unmatchedCarrier,
      contractorParsed.lineItems,  // Pass all items for O&P detection
      carrierParsed.lineItems
    );

    console.log(`[Estimate Engine] Found ${reconciliation.discrepancies.length} discrepancies`);
    console.log(`[Estimate Engine] Underpayment: $${reconciliation.totals.underpayment_amount}`);
    console.log(`[Estimate Engine] Unit conversions applied: ${reconciliation.stats.unit_conversions_applied}`);
    console.log(`[Estimate Engine] O&P Gap: $${reconciliation.opAnalysis.gap.total_op_gap}`);

    // Validate reconciliation
    const validation = validateReconciliation(reconciliation);
    if (!validation.valid) {
      console.error('Reconciliation validation failed:', validation.errors);
      return sendError('Reconciliation validation failed', 'CALC-001', 500, {
        errors: validation.errors
      });
    }

    // =====================================================
    // PHASE 6A: FINANCIAL EXPOSURE CALCULATION
    // =====================================================
    console.log('[Estimate Engine] Phase 6A: Calculating financial exposure...');
    
    const exposureSummary = calculateExposure(
      reconciliation,
      contractorParsed.lineItems,
      carrierParsed.lineItems
    );
    
    console.log(`[Estimate Engine] Total Projected Recovery: $${exposureSummary.totalProjectedRecovery}`);
    console.log(`[Estimate Engine] RCV Delta: $${exposureSummary.rcvDeltaTotal}`);
    console.log(`[Estimate Engine] ACV Delta: $${exposureSummary.acvDeltaTotal}`);
    console.log(`[Estimate Engine] Recoverable Depreciation: $${exposureSummary.recoverableDepreciationTotal}`);
    console.log(`[Estimate Engine] O&P Exposure: $${exposureSummary.opExposure.opAmount}`);
    console.log(`[Estimate Engine] O&P Qualifies: ${exposureSummary.opExposure.qualifiesForOP}`);
    
    // Validate financial exposure
    if (!exposureSummary.validation.valid) {
      console.error('Financial exposure validation failed:', exposureSummary.validation.errors);
      return sendError('Financial exposure validation failed', 'CALC-002', 500, {
        errors: exposureSummary.validation.errors,
        warnings: exposureSummary.validation.warnings
      });
    }
    
    if (exposureSummary.validation.warnings.length > 0) {
      console.warn('Financial exposure warnings:', exposureSummary.validation.warnings);
    }

    // =====================================================
    // PHASE 6B: CODE UPGRADE DETECTION
    // =====================================================
    console.log('[Estimate Engine] Phase 6B: Analyzing code upgrade requirements...');
    
    const codeUpgrades = analyzeCodeUpgrades({
      lineItems: contractorParsed.lineItems,
      reconciliation: reconciliation,
      exposure: exposureSummary,
      propertyMetadata: body.property_metadata || {},
      regionalData: body.regional_data || {}
    });
    
    console.log(`[Estimate Engine] Code Upgrade Flags: ${codeUpgrades.flagCount}`);
    console.log(`[Estimate Engine] Code Upgrade Exposure: $${codeUpgrades.totalCodeUpgradeExposure}`);

    // =====================================================
    // PHASE 6C: POLICY-TO-ESTIMATE CROSSWALK
    // =====================================================
    console.log('[Estimate Engine] Phase 6C: Cross-referencing policy coverage...');
    
    // Fetch policy data if available
    let parsedPolicy = {};
    if (claim.policy_id) {
      const { data: policyData } = await supabase
        .from('policies')
        .select('*')
        .eq('id', claim.policy_id)
        .single();
      
      if (policyData) {
        parsedPolicy = policyData;
      }
    }
    
    const coverageCrosswalk = analyzePolicyCrosswalk({
      parsedPolicy: parsedPolicy,
      reconciliation: reconciliation,
      exposure: exposureSummary,
      lineItems: contractorParsed.lineItems
    });
    
    console.log(`[Estimate Engine] Coverage Conflicts: ${coverageCrosswalk.conflictCount}`);
    console.log(`[Estimate Engine] Coverage Adjustments: $${coverageCrosswalk.coverageExposureAdjustments}`);

    // =====================================================
    // PHASE 6D: CARRIER PATTERN DETECTION
    // =====================================================
    console.log('[Estimate Engine] Phase 6D: Analyzing carrier patterns...');
    
    // Fetch historical data for this carrier (if available)
    const carrierName = body.carrier_name || claim.carrier_name || 'Unknown';
    const { data: historicalData } = await supabase
      .from('claim_estimate_comparison')
      .select('*')
      .eq('carrier_name', carrierName)
      .order('created_at', { ascending: false })
      .limit(50);
    
    const carrierPatterns = analyzeCarrierPatterns({
      carrierName: carrierName,
      reconciliation: reconciliation,
      exposure: exposureSummary,
      historicalData: historicalData || [],
      supabase: supabase
    });
    
    console.log(`[Estimate Engine] Carrier Patterns Detected: ${carrierPatterns.patternCount}`);
    console.log(`[Estimate Engine] Carrier Risk Level: ${carrierPatterns.riskLevel}`);
    console.log(`[Estimate Engine] Severity Score: ${carrierPatterns.severityScore}`);

    // =====================================================
    // PHASE 6E: PRICING VALIDATION
    // =====================================================
    console.log('[Estimate Engine] Phase 6E: Validating pricing against market data...');
    
    const claimState = claim.state || body.state || null;
    const pricingValidation = await validatePricing(
      contractorParsed.lineItems,
      carrierParsed.lineItems,
      matchResult.matches,
      claimState
    );
    
    console.log(`[Estimate Engine] Pricing validation complete. Critical items: ${pricingValidation.carrier_pricing.summary.critical_items.length}`);
    console.log(`[Estimate Engine] Total pricing risk: $${pricingValidation.report.overall_assessment.total_pricing_risk.toFixed(2)}`);

    // =====================================================
    // PHASE 6F: DEPRECIATION ABUSE DETECTION
    // =====================================================
    console.log('[Estimate Engine] Phase 6F: Detecting depreciation abuse...');
    
    const depreciationAnalysis = await detectDepreciationAbuse(
      carrierParsed.lineItems,
      parsedPolicy,
      contractorParsed.lineItems
    );
    
    console.log(`[Estimate Engine] Depreciation abuses detected: ${depreciationAnalysis.deterministic.summary.abuses_detected}`);
    console.log(`[Estimate Engine] Depreciation recovery potential: $${depreciationAnalysis.deterministic.summary.total_recovery_potential.toFixed(2)}`);

    // =====================================================
    // PHASE 6G: CARRIER TACTIC DETECTION
    // =====================================================
    console.log('[Estimate Engine] Phase 6G: Detecting carrier tactics...');
    
    const carrierTactics = await detectCarrierTactics(
      contractorParsed.lineItems,
      carrierParsed.lineItems,
      matchResult.matches,
      reconciliation.discrepancies,
      parsedPolicy,
      reconciliation.categoryBreakdown,
      reconciliation.opAnalysis
    );
    
    console.log(`[Estimate Engine] Carrier tactics detected: ${carrierTactics.summary.total_tactics_detected}`);
    console.log(`[Estimate Engine] Tactic recovery potential: $${carrierTactics.summary.total_recovery_potential.toFixed(2)}`);

    // =====================================================
    // PHASE 6H: LOSS EXPECTATION ANALYSIS
    // =====================================================
    console.log('[Estimate Engine] Phase 6H: Analyzing loss type and expected trades...');
    
    let lossExpectation = { success: false, error: 'Not executed' };
    try {
      lossExpectation = analyzeLossExpectation({
        lineItems: contractorParsed.lineItems,
        claimMetadata: {
          claim_number: claim.claim_number,
          loss_date: claim.loss_date,
          property_type: claim.property_type
        }
      });
      
      console.log(`[Estimate Engine] Loss Type: ${lossExpectation.lossType} (${lossExpectation.severity})`);
      console.log(`[Estimate Engine] Missing Trades: ${lossExpectation.missingTrades.length}`);
      console.log(`[Estimate Engine] Unexpected Trades: ${lossExpectation.unexpectedTrades.length}`);
    } catch (lossError) {
      console.error('[Estimate Engine] Loss expectation analysis failed:', lossError);
      lossExpectation = { success: false, error: lossError.message };
    }

    // =====================================================
    // PHASE 6I: TRADE COMPLETENESS SCORING
    // =====================================================
    console.log('[Estimate Engine] Phase 6I: Scoring trade completeness...');
    
    let tradeCompleteness = { success: false, error: 'Not executed' };
    try {
      tradeCompleteness = analyzeTradeCompleteness({
        lineItems: contractorParsed.lineItems
      });
      
      console.log(`[Estimate Engine] Trade Integrity Score: ${tradeCompleteness.integrityScore}/100 (${tradeCompleteness.classification})`);
      console.log(`[Estimate Engine] Incomplete Trades: ${tradeCompleteness.incompleteTrades.length}`);
    } catch (tradeError) {
      console.error('[Estimate Engine] Trade completeness analysis failed:', tradeError);
      tradeCompleteness = { success: false, error: tradeError.message };
    }

    // =====================================================
    // PHASE 6J: LABOR RATE VALIDATION
    // =====================================================
    console.log('[Estimate Engine] Phase 6J: Validating labor rates...');
    
    let laborAnalysis = { success: false, error: 'Not executed' };
    try {
      laborAnalysis = await validateLaborRates({
        lineItems: contractorParsed.lineItems,
        region: claimState || 'national'
      });
      
      console.log(`[Estimate Engine] Labor Score: ${laborAnalysis.laborScore}/100`);
      console.log(`[Estimate Engine] Undervalued Labor Items: ${laborAnalysis.undervaluedItems.length}`);
      console.log(`[Estimate Engine] Labor Recovery Potential: $${laborAnalysis.totalRecoveryPotential.toFixed(2)}`);
    } catch (laborError) {
      console.error('[Estimate Engine] Labor rate validation failed:', laborError);
      laborAnalysis = { success: false, error: laborError.message };
    }

    // =====================================================
    // PHASE 6K: INPUT QUALITY REPORT
    // =====================================================
    const inputQualityReport = generateInputQualityReport(contractorValidation, carrierValidation);

    // =====================================================
    // PHASE 6L: CALCULATE TOTAL PROJECTED RECOVERY (WITH ALL LAYERS)
    // =====================================================
    console.log('[Estimate Engine] Phase 6L: Calculating total with all enforcement layers...');
    
    const totalProjectedRecoveryWithEnforcement = 
      exposureSummary.totalProjectedRecovery +
      codeUpgrades.totalCodeUpgradeExposure +
      coverageCrosswalk.coverageExposureAdjustments +
      (pricingValidation.report.overall_assessment.total_pricing_risk || 0) +
      (depreciationAnalysis.deterministic.summary.total_recovery_potential || 0) +
      (carrierTactics.summary.total_recovery_potential || 0) +
      (laborAnalysis.success ? laborAnalysis.totalRecoveryPotential : 0);
    
    console.log(`[Estimate Engine] FINAL Total Projected Recovery: $${totalProjectedRecoveryWithEnforcement}`);
    console.log(`[Estimate Engine]   - Base Exposure: $${exposureSummary.totalProjectedRecovery}`);
    console.log(`[Estimate Engine]   - Code Upgrades: $${codeUpgrades.totalCodeUpgradeExposure}`);
    console.log(`[Estimate Engine]   - Coverage Adjustments: $${coverageCrosswalk.coverageExposureAdjustments}`);
    console.log(`[Estimate Engine]   - Pricing Issues: $${pricingValidation.report.overall_assessment.total_pricing_risk || 0}`);
    console.log(`[Estimate Engine]   - Depreciation Abuse: $${depreciationAnalysis.deterministic.summary.total_recovery_potential || 0}`);
    console.log(`[Estimate Engine]   - Carrier Tactics: $${carrierTactics.summary.total_recovery_potential || 0}`);
    console.log(`[Estimate Engine]   - Labor Rate Issues: $${laborAnalysis.success ? laborAnalysis.totalRecoveryPotential : 0}`);

    // =====================================================
    // PHASE 7: STORE DISCREPANCIES
    // =====================================================
    console.log('[Estimate Engine] Phase 7: Storing discrepancies...');
    
    if (reconciliation.discrepancies.length > 0) {
      const discrepancyInserts = reconciliation.discrepancies.map(disc => ({
        claim_id: body.claim_id,
        user_id: userId,
        ...disc
      }));

      const { error: discError } = await supabase
        .from('claim_estimate_discrepancies')
        .insert(discrepancyInserts);

      if (discError) {
        console.error('Failed to store discrepancies:', discError);
      }
    }

    // =====================================================
    // PHASE 8: UPDATE FINANCIAL SUMMARY
    // =====================================================
    console.log('[Estimate Engine] Phase 8: Updating financial summary...');
    
    const { error: financialError } = await supabase
      .from('claim_financial_summary')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        contractor_total: reconciliation.totals.contractor_total,
        carrier_total: reconciliation.totals.carrier_total,
        underpayment_estimate: reconciliation.totals.underpayment_amount
      }, {
        onConflict: 'claim_id'
      });

    if (financialError) {
      console.error('Failed to update financial summary:', financialError);
    }

    // Store comparison record
    await supabase.from('claim_estimate_comparison').upsert({
      claim_id: body.claim_id,
      user_id: userId,
      total_contractor_lines: contractorParsed.lineItems.length,
      total_carrier_lines: carrierParsed.lineItems.length,
      matched_lines: matchResult.matches.length,
      unmatched_contractor_lines: matchResult.unmatchedContractor.length,
      unmatched_carrier_lines: matchResult.unmatchedCarrier.length,
      exact_matches: matchResult.stats.exact_matches,
      fuzzy_matches: matchResult.stats.fuzzy_matches,
      category_matches: matchResult.stats.category_matches,
      semantic_matches: semanticMatches.length,
      contractor_total: reconciliation.totals.contractor_total,
      carrier_total: reconciliation.totals.carrier_total,
      total_discrepancies: reconciliation.discrepancies.length,
      total_discrepancy_amount: reconciliation.totals.total_discrepancy_amount,
      underpayment_amount: reconciliation.totals.underpayment_amount,
      overpayment_amount: reconciliation.totals.overpayment_amount,
      category_breakdown: reconciliation.categoryBreakdown,
      comparison_method: 'deterministic',
      comparison_version: '2.0',
      processing_duration_ms: Date.now() - startTime
    }, {
      onConflict: 'claim_id'
    });

    // Store financial exposure report
    const { error: exposureError } = await supabase
      .from('claim_financial_exposure_reports')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        total_projected_recovery: exposureSummary.totalProjectedRecovery,
        rcv_delta_total: exposureSummary.rcvDeltaTotal,
        acv_delta_total: exposureSummary.acvDeltaTotal,
        recoverable_depreciation_total: exposureSummary.recoverableDepreciationTotal,
        op_qualifies: exposureSummary.opExposure.qualifiesForOP,
        op_amount: exposureSummary.opExposure.opAmount,
        op_trades_detected: exposureSummary.opExposure.tradesDetected,
        op_trade_count: exposureSummary.opExposure.tradeCount,
        op_reason: exposureSummary.opExposure.reason,
        op_calculation: exposureSummary.opExposure.calculation,
        category_breakdown: exposureSummary.categoryBreakdown,
        structured_line_item_deltas: exposureSummary.structuredLineItemDeltas,
        negotiation_payload: exposureSummary.negotiationPayload,
        negotiation_points: exposureSummary.negotiationPayload.negotiationPoints,
        validation_status: exposureSummary.validation.valid ? 'valid' : 
                          (exposureSummary.validation.warnings.length > 0 ? 'warnings' : 'errors'),
        validation_errors: exposureSummary.validation.errors,
        validation_warnings: exposureSummary.validation.warnings,
        calculation_method: exposureSummary.metadata.calculation_method,
        engine_version: exposureSummary.metadata.engine_version,
        processing_time_ms: exposureSummary.metadata.processing_time_ms,
        total_discrepancies_analyzed: exposureSummary.metadata.total_discrepancies_analyzed
      }, {
        onConflict: 'claim_id'
      });
    
    if (exposureError) {
      console.error('Failed to store financial exposure report:', exposureError);
      // Continue - not critical
    }

    // Store enforcement report (code upgrades, coverage conflicts, carrier patterns)
    const { error: enforcementError } = await supabase
      .from('claim_enforcement_reports')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        total_projected_recovery_with_enforcement: totalProjectedRecoveryWithEnforcement,
        base_exposure: exposureSummary.totalProjectedRecovery,
        code_upgrade_exposure: codeUpgrades.totalCodeUpgradeExposure,
        coverage_adjustment_exposure: coverageCrosswalk.coverageExposureAdjustments,
        pricing_risk_exposure: pricingValidation.report.overall_assessment.total_pricing_risk || 0,
        depreciation_abuse_exposure: depreciationAnalysis.deterministic.summary.total_recovery_potential || 0,
        carrier_tactic_exposure: carrierTactics.summary.total_recovery_potential || 0,
        labor_rate_exposure: laborAnalysis.success ? laborAnalysis.totalRecoveryPotential : 0,
        code_upgrade_flags: codeUpgrades.codeUpgradeFlags,
        code_upgrade_flag_count: codeUpgrades.flagCount,
        coverage_conflicts: coverageCrosswalk.coverageConflicts,
        coverage_conflict_count: coverageCrosswalk.conflictCount,
        carrier_pattern_flags: carrierPatterns.patternFlags,
        carrier_pattern_count: carrierPatterns.patternCount,
        carrier_severity_score: carrierPatterns.severityScore,
        carrier_risk_level: carrierPatterns.riskLevel,
        carrier_name: carrierName,
        pricing_issues_count: pricingValidation.pricing_issues.length,
        depreciation_abuses_count: depreciationAnalysis.deterministic.summary.abuses_detected,
        carrier_tactics_count: carrierTactics.summary.total_tactics_detected,
        engine_version: '2.3',
        calculation_method: 'deterministic_with_advanced_detection'
      }, {
        onConflict: 'claim_id'
      });
    
    if (enforcementError) {
      console.error('Failed to store enforcement report:', enforcementError);
      // Continue - not critical
    }

    // Update step status
    await supabase
      .from('claim_steps')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 8,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id,step_number'
      });

    // =====================================================
    // PHASE 9: GENERATE SUMMARY
    // =====================================================
    const summary = generateSummary(reconciliation);

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/analyze-estimates-v2',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Estimate Engine] Analysis complete in ${Date.now() - startTime}ms`);

    return sendSuccess({
      // FINANCIAL EXPOSURE (PRIMARY OUTPUT WITH ENFORCEMENT LAYERS)
      exposure: {
        totalProjectedRecovery: exposureSummary.totalProjectedRecovery,
        totalProjectedRecoveryWithEnforcement: totalProjectedRecoveryWithEnforcement,
        rcvDeltaTotal: exposureSummary.rcvDeltaTotal,
        acvDeltaTotal: exposureSummary.acvDeltaTotal,
        recoverableDepreciationTotal: exposureSummary.recoverableDepreciationTotal,
        opExposure: exposureSummary.opExposure,
        categoryBreakdown: exposureSummary.categoryBreakdown,
        structuredLineItemDeltas: exposureSummary.structuredLineItemDeltas,
        negotiationPayload: exposureSummary.negotiationPayload
      },
      
      // ENFORCEMENT LAYERS
      enforcement: {
        totalProjectedRecoveryWithEnforcement: totalProjectedRecoveryWithEnforcement,
        codeUpgrades: codeUpgrades,
        coverageCrosswalk: coverageCrosswalk,
        carrierPatterns: carrierPatterns,
        pricingValidation: pricingValidation,
        depreciationAbuse: depreciationAnalysis,
        carrierTactics: carrierTactics,
        lossExpectation: lossExpectation,
        tradeCompleteness: tradeCompleteness,
        laborAnalysis: laborAnalysis
      },
      
      // INPUT QUALITY
      input_quality: inputQualityReport,
      
      // LEGACY COMPARISON (BACKWARD COMPATIBILITY)
      comparison: {
        contractor_total: reconciliation.totals.contractor_total,
        carrier_total: reconciliation.totals.carrier_total,
        underpayment_estimate: reconciliation.totals.underpayment_amount,
        overpayment_estimate: reconciliation.totals.overpayment_amount,
        net_difference: reconciliation.totals.net_difference
      },
      
      // DETAILED RECONCILIATION DATA
      discrepancies: reconciliation.discrepancies,
      category_breakdown: reconciliation.categoryBreakdown,
      op_analysis: reconciliation.opAnalysis,
      unit_conversion_warnings: reconciliation.unitConversionWarnings,
      summary,
      
      // STATISTICS
      stats: {
        parsing: {
          contractor_lines: contractorParsed.lineItems.length,
          carrier_lines: carrierParsed.lineItems.length,
          contractor_parse_rate: contractorParsed.metadata.parse_success_rate,
          carrier_parse_rate: carrierParsed.metadata.parse_success_rate
        },
        matching: {
          total_matched: matchResult.matches.length,
          exact_matches: matchResult.stats.exact_matches,
          fuzzy_matches: matchResult.stats.fuzzy_matches,
          category_matches: matchResult.stats.category_matches,
          semantic_matches: semanticMatches.length,
          unmatched_contractor: matchResult.unmatchedContractor.length,
          unmatched_carrier: matchResult.unmatchedCarrier.length
        },
        reconciliation: reconciliation.stats
      },
      
      // METADATA
      processing_time_ms: Date.now() - startTime,
      engine_version: '3.1',  // Updated version with Loss Intelligence + Trade Completeness + Labor Validation
      method: 'deterministic_with_advanced_detection',
      analysis_layers: [
        'parsing',
        'matching',
        'reconciliation',
        'financial_exposure',
        'code_upgrades',
        'coverage_crosswalk',
        'carrier_patterns',
        'pricing_validation',
        'depreciation_abuse_detection',
        'carrier_tactic_recognition',
        'loss_expectation_analysis',
        'trade_completeness_scoring',
        'labor_rate_validation',
        'input_quality_validation'
      ]
    });

  } catch (error) {
    console.error('Estimate analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-estimates-v2',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Estimate analysis failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

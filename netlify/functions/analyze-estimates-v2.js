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
    // PHASE 5: AI SEMANTIC MATCHING (FALLBACK ONLY)
    // =====================================================
    let semanticMatches = [];
    
    if (matchResult.unmatchedContractor.length > 0 && matchResult.unmatchedCarrier.length > 0) {
      console.log('[Estimate Engine] Phase 5: AI semantic matching for unmatched items...');
      
      try {
        semanticMatches = await semanticMatch(
          matchResult.unmatchedContractor,
          matchResult.unmatchedCarrier,
          openai
        );
        
        console.log(`[Estimate Engine] AI matched ${semanticMatches.length} additional items`);
        
        // Add semantic matches to main matches
        matchResult.matches.push(...semanticMatches);
        
        // Remove semantically matched items from unmatched lists
        for (const match of semanticMatches) {
          const cIndex = matchResult.unmatchedContractor.findIndex(i => i.id === match.contractor.id);
          if (cIndex !== -1) matchResult.unmatchedContractor.splice(cIndex, 1);
          
          const caIndex = matchResult.unmatchedCarrier.findIndex(i => i.id === match.carrier.id);
          if (caIndex !== -1) matchResult.unmatchedCarrier.splice(caIndex, 1);
        }
      } catch (aiError) {
        console.error('AI semantic matching failed:', aiError);
        // Continue without semantic matches
      }
    }

    // =====================================================
    // PHASE 6: RECONCILIATION (DETERMINISTIC MATH)
    // =====================================================
    console.log('[Estimate Engine] Phase 6: Reconciling estimates...');
    
    const reconciliation = reconcileEstimates(
      matchResult.matches,
      matchResult.unmatchedContractor,
      matchResult.unmatchedCarrier
    );

    console.log(`[Estimate Engine] Found ${reconciliation.discrepancies.length} discrepancies`);
    console.log(`[Estimate Engine] Underpayment: $${reconciliation.totals.underpayment_amount}`);

    // Validate reconciliation
    const validation = validateReconciliation(reconciliation);
    if (!validation.valid) {
      console.error('Reconciliation validation failed:', validation.errors);
      return sendError('Reconciliation validation failed', 'CALC-001', 500, {
        errors: validation.errors
      });
    }

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
      comparison: {
        contractor_total: reconciliation.totals.contractor_total,
        carrier_total: reconciliation.totals.carrier_total,
        underpayment_estimate: reconciliation.totals.underpayment_amount,
        overpayment_estimate: reconciliation.totals.overpayment_amount,
        net_difference: reconciliation.totals.net_difference
      },
      discrepancies: reconciliation.discrepancies,
      category_breakdown: reconciliation.categoryBreakdown,
      summary,
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
      processing_time_ms: Date.now() - startTime,
      engine_version: '2.0',
      method: 'deterministic'
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

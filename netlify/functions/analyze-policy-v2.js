/**
 * API Endpoint: /analyze-policy-v2
 * Policy Review Engine v2 - Structured Coverage Extraction
 * Deterministic regex → AI fallback → Validation
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { parsePolicyDocument, validateCoverageData, extractWithAI, mergePolicyData, calculateHash } = require('./lib/policy-parser');
const { calculatePolicyTriggers, generatePolicyRecommendations } = require('./lib/policy-trigger-engine');

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

    if (!body.policy_pdf_url) {
      return sendError('policy_pdf_url is required', 'VAL-002', 400);
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

    console.log(`[Policy v2] Starting analysis for claim ${claim.claim_number}`);

    // =====================================================
    // PHASE 1: EXTRACT PDF TEXT
    // =====================================================
    console.log('[Policy v2] Phase 1: Extracting PDF text...');
    
    let policyText;
    try {
      const response = await fetch(body.policy_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download policy PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      policyText = pdfData.text;

      if (!policyText || policyText.trim().length < 100) {
        throw new Error('Policy PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('Policy PDF parsing error:', pdfError);
      return sendError('Failed to parse policy PDF', 'PDF-001', 400, {
        details: pdfError.message
      });
    }

    // Check if already processed (hash match)
    const textHash = calculateHash(policyText);
    const { data: existingPolicy } = await supabase
      .from('claim_policy_coverage')
      .select('*')
      .eq('claim_id', body.claim_id)
      .eq('raw_policy_text_hash', textHash)
      .single();

    if (existingPolicy && !body.force_reprocess) {
      console.log('[Policy v2] Policy already processed with same hash, returning cached data');
      
      return sendSuccess({
        coverage: existingPolicy,
        cached: true,
        message: 'Policy already processed'
      });
    }

    // =====================================================
    // PHASE 2: DETERMINISTIC EXTRACTION
    // =====================================================
    console.log('[Policy v2] Phase 2: Deterministic extraction...');
    
    let coverageData = parsePolicyDocument(policyText);
    
    console.log('[Policy v2] Deterministic extraction results:');
    console.log(`  - Dwelling: ${coverageData.dwelling_limit ? '$' + coverageData.dwelling_limit : 'not found'}`);
    console.log(`  - Contents: ${coverageData.contents_limit ? '$' + coverageData.contents_limit : 'not found'}`);
    console.log(`  - ALE: ${coverageData.ale_limit ? '$' + coverageData.ale_limit : 'not found'}`);
    console.log(`  - Deductible: ${coverageData.deductible ? '$' + coverageData.deductible : 'not found'}`);
    console.log(`  - Settlement Type: ${coverageData.settlement_type || 'not found'}`);

    // =====================================================
    // PHASE 3: AI FALLBACK (if major fields missing)
    // =====================================================
    const majorFields = ['dwelling_limit', 'contents_limit', 'deductible', 'settlement_type'];
    const missingMajorFields = majorFields.filter(field => !coverageData[field]);
    
    if (missingMajorFields.length > 0) {
      console.log(`[Policy v2] Phase 3: AI fallback for missing fields: ${missingMajorFields.join(', ')}`);
      
      try {
        const aiData = await extractWithAI(policyText, openai);
        
        if (aiData) {
          coverageData = mergePolicyData(coverageData, aiData);
          console.log('[Policy v2] AI extraction completed');
          console.log(`  - AI Confidence: ${aiData.ai_confidence}`);
        }
      } catch (aiError) {
        console.error('[Policy v2] AI extraction failed:', aiError);
        // Continue with deterministic data only
      }
    }

    // =====================================================
    // PHASE 4: VALIDATION
    // =====================================================
    console.log('[Policy v2] Phase 4: Validating coverage data...');
    
    coverageData = validateCoverageData(coverageData);

    // =====================================================
    // PHASE 5: STORE IN DATABASE
    // =====================================================
    console.log('[Policy v2] Phase 5: Storing coverage data...');
    
    const { data: storedCoverage, error: storeError } = await supabase
      .from('claim_policy_coverage')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        ...coverageData
      }, {
        onConflict: 'claim_id'
      })
      .select()
      .single();

    if (storeError) {
      console.error('[Policy v2] Failed to store coverage:', storeError);
      return sendError('Failed to store policy coverage', 'DB-001', 500);
    }

    // =====================================================
    // PHASE 6: CALCULATE POLICY TRIGGERS
    // =====================================================
    console.log('[Policy v2] Phase 6: Calculating policy triggers...');
    
    // Get discrepancies for trigger calculation
    const { data: discrepancies } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', body.claim_id);

    // Get comparison data
    const { data: comparison } = await supabase
      .from('claim_estimate_comparison')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    const triggers = calculatePolicyTriggers(
      storedCoverage,
      discrepancies || [],
      comparison
    );

    console.log('[Policy v2] Triggers calculated:');
    console.log(`  - Ordinance: ${triggers.ordinance_trigger}`);
    console.log(`  - Matching: ${triggers.matching_trigger}`);
    console.log(`  - Depreciation: ${triggers.depreciation_trigger}`);
    console.log(`  - Sublimit: ${triggers.sublimit_trigger}`);

    // Store triggers
    await supabase
      .from('claim_policy_triggers')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        policy_coverage_id: storedCoverage.id,
        ...triggers
      }, {
        onConflict: 'claim_id'
      });

    // Generate recommendations
    const recommendations = generatePolicyRecommendations(triggers, storedCoverage);

    // =====================================================
    // PHASE 7: UPDATE STEP STATUS
    // =====================================================
    await supabase
      .from('claim_steps')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 2,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id,step_number'
      });

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/analyze-policy-v2',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Policy v2] Analysis complete in ${Date.now() - startTime}ms`);

    // =====================================================
    // PHASE 8: RETURN STRUCTURED DATA
    // =====================================================
    return sendSuccess({
      coverage: {
        dwelling_limit: storedCoverage.dwelling_limit,
        other_structures_limit: storedCoverage.other_structures_limit,
        contents_limit: storedCoverage.contents_limit,
        ale_limit: storedCoverage.ale_limit,
        deductible: storedCoverage.deductible,
        deductible_type: storedCoverage.deductible_type,
        settlement_type: storedCoverage.settlement_type,
        ordinance_law_percent: storedCoverage.ordinance_law_percent,
        ordinance_law_limit: storedCoverage.ordinance_law_limit
      },
      
      endorsements: {
        matching: storedCoverage.matching_endorsement,
        cosmetic_exclusion: storedCoverage.cosmetic_exclusion,
        roof_acv: storedCoverage.roof_acv_endorsement,
        replacement_cost: storedCoverage.replacement_cost_endorsement,
        special: storedCoverage.special_endorsements
      },
      
      policy_type: {
        named_peril: storedCoverage.named_peril_policy,
        open_peril: storedCoverage.open_peril_policy
      },
      
      sublimits: {
        water: storedCoverage.water_sublimit,
        mold: storedCoverage.mold_sublimit,
        sewer_backup: storedCoverage.sewer_backup_sublimit
      },
      
      exclusions: storedCoverage.exclusion_flags,
      
      triggers: triggers,
      
      recommendations: recommendations,
      
      metadata: {
        parsed_by: storedCoverage.parsed_by,
        ai_confidence: storedCoverage.ai_confidence,
        processing_time_ms: Date.now() - startTime,
        engine_version: '2.0'
      }
    });

  } catch (error) {
    console.error('[Policy v2] Analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-policy-v2',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Policy analysis failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

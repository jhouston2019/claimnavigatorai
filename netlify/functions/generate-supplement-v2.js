/**
 * API Endpoint: /generate-supplement-v2
 * Professional Supplement Generator using Estimate Engine v2.1 data
 * ALL MATH IS DETERMINISTIC - AI ONLY FORMATS
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildSupplement } = require('./lib/supplement-builder');
const { formatSupplementHTML, formatSupplementText, polishWithAI } = require('./lib/supplement-formatter');

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

    console.log(`[Supplement v2] Starting generation for claim ${claim.claim_number}`);

    // =====================================================
    // STEP 1: BUILD STRUCTURED SUPPLEMENT FROM DATABASE
    // =====================================================
    console.log('[Supplement v2] Step 1: Building structured supplement...');
    
    const supplementData = await buildSupplement(body.claim_id, supabase);
    
    console.log(`[Supplement v2] Structured data built:`);
    console.log(`  - Total request: $${supplementData.totals.total_supplement_request}`);
    console.log(`  - Categories: ${supplementData.metadata.categories_affected}`);
    console.log(`  - Discrepancies: ${supplementData.metadata.total_discrepancies}`);

    // =====================================================
    // STEP 2: FORMAT AS HTML AND TEXT
    // =====================================================
    console.log('[Supplement v2] Step 2: Formatting document...');
    
    const formattedHTML = formatSupplementHTML(supplementData);
    const formattedText = formatSupplementText(supplementData);

    // =====================================================
    // STEP 3: OPTIONAL AI POLISH (language only, not numbers)
    // =====================================================
    let polishedText = formattedText;
    
    if (body.polish_with_ai !== false) {
      console.log('[Supplement v2] Step 3: Polishing language with AI...');
      try {
        polishedText = await polishWithAI(formattedText, openai);
      } catch (aiError) {
        console.error('[Supplement v2] AI polish failed, using original:', aiError);
        polishedText = formattedText;
      }
    }

    // =====================================================
    // STEP 4: STORE IN DATABASE
    // =====================================================
    console.log('[Supplement v2] Step 4: Storing document...');
    
    const { data: generatedDoc, error: docError } = await supabase
      .from('claim_generated_documents')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        document_type: 'supplement_v2',
        title: `Supplement Request - Claim ${claim.claim_number}`,
        content_html: formattedHTML,
        content_markdown: polishedText,
        template_version: '2.0',
        ai_model: body.polish_with_ai !== false ? 'gpt-4-turbo-preview' : null,
        status: 'draft'
      })
      .select()
      .single();

    if (docError) {
      console.error('[Supplement v2] Failed to store document:', docError);
      return sendError('Failed to store supplement document', 'DB-001', 500);
    }

    // =====================================================
    // STEP 5: UPDATE CLAIM STEP STATUS
    // =====================================================
    await supabase
      .from('claim_steps')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 10,
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: `Supplement generated: $${supplementData.totals.total_supplement_request.toFixed(2)} requested`
      }, {
        onConflict: 'claim_id,step_number'
      });

    // =====================================================
    // STEP 6: LOG REQUEST
    // =====================================================
    await logAPIRequest({
      userId,
      endpoint: '/generate-supplement-v2',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Supplement v2] Generation complete in ${Date.now() - startTime}ms`);

    // =====================================================
    // STEP 7: RETURN RESPONSE
    // =====================================================
    return sendSuccess({
      document_id: generatedDoc.id,
      
      totals: {
        total_requested: supplementData.totals.total_supplement_request,
        underpayment_estimate: supplementData.totals.underpayment_estimate,
        op_gap: supplementData.totals.op_gap,
        depreciation_impact: supplementData.totals.depreciation_impact
      },
      
      category_breakdown: supplementData.category_breakdown,
      
      formatted_letter_html: formattedHTML,
      formatted_letter_text: polishedText,
      
      metadata: {
        ...supplementData.metadata,
        ai_polished: body.polish_with_ai !== false,
        processing_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('[Supplement v2] Generation error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/generate-supplement-v2',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Supplement generation failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

/**
 * API Endpoint: /analyze-policy
 * Analyzes insurance policy PDF and extracts structured coverage information
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildPolicyAnalysisPrompt } = require('./lib/ai-prompts');

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
      .select('id, user_id, claim_number, policy_number, insurer')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    // Download and parse PDF
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
      console.error('PDF parsing error:', pdfError);
      return sendError('Failed to parse policy PDF', 'PDF-001', 400, {
        details: pdfError.message
      });
    }

    // Call OpenAI for policy analysis
    let analysisResult;
    try {
      const prompt = buildPolicyAnalysisPrompt(policyText);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance policy analyst. Return only valid JSON with no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      analysisResult = JSON.parse(responseText);
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      return sendError('AI analysis failed', 'AI-001', 500, {
        details: aiError.message
      });
    }

    // Store analysis output
    const { data: output, error: outputError } = await supabase
      .from('claim_outputs')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 2,
        output_type: 'policy_analysis',
        output_json: analysisResult,
        input_document_ids: body.document_id ? [body.document_id] : [],
        ai_model: 'gpt-4-turbo-preview',
        processing_time_ms: Date.now() - startTime
      })
      .select()
      .single();

    if (outputError) {
      console.error('Failed to store output:', outputError);
      // Continue anyway - we have the analysis
    }

    // Store policy coverage details
    const { error: coverageError } = await supabase
      .from('claim_policy_coverage')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        output_id: output?.id,
        dwelling_limit: analysisResult.coverage_limits?.dwelling,
        contents_limit: analysisResult.coverage_limits?.contents,
        ale_limit: analysisResult.ale_limit?.amount,
        ordinance_law_limit: analysisResult.ordinance_law?.limit,
        deductible_amount: analysisResult.deductible?.amount,
        deductible_type: analysisResult.deductible?.type,
        settlement_type: analysisResult.settlement_type,
        ordinance_law_coverage: analysisResult.ordinance_law?.included || false,
        code_upgrade_coverage: analysisResult.code_upgrade_coverage?.included || false,
        matching_coverage: analysisResult.special_provisions?.matching_coverage || false,
        exclusions: analysisResult.exclusions || [],
        limitations: analysisResult.limitations || [],
        endorsements: analysisResult.endorsements || [],
        risk_notes: analysisResult.risk_notes || []
      }, {
        onConflict: 'claim_id'
      });

    if (coverageError) {
      console.error('Failed to store coverage:', coverageError);
    }

    // Update step status
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
      endpoint: '/analyze-policy',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    return sendSuccess({
      output_id: output?.id,
      analysis: analysisResult,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Policy analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-policy',
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

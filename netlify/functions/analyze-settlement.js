/**
 * API Endpoint: /analyze-settlement
 * Analyzes settlement letter and extracts financial breakdown
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildSettlementAnalysisPrompt } = require('./lib/ai-prompts');

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

    if (!body.settlement_pdf_url) {
      return sendError('settlement_pdf_url is required', 'VAL-002', 400);
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

    // Download and parse settlement PDF
    let settlementText;
    try {
      const response = await fetch(body.settlement_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download settlement PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      settlementText = pdfData.text;

      if (!settlementText || settlementText.trim().length < 100) {
        throw new Error('Settlement PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return sendError('Failed to parse settlement PDF', 'PDF-001', 400, {
        details: pdfError.message
      });
    }

    // Get estimate data for comparison
    const { data: estimateOutput, error: estimateError } = await supabase
      .from('claim_outputs')
      .select('output_json')
      .eq('claim_id', body.claim_id)
      .eq('output_type', 'estimate_comparison')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const estimateData = estimateOutput?.output_json || {};

    // Call OpenAI for settlement analysis
    let analysisResult;
    try {
      const prompt = buildSettlementAnalysisPrompt(settlementText, estimateData);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance settlement analyst. Return only valid JSON with no additional text.'
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
        step_number: 13,
        output_type: 'settlement_analysis',
        output_json: analysisResult,
        input_document_ids: body.document_id ? [body.document_id] : [],
        ai_model: 'gpt-4-turbo-preview',
        processing_time_ms: Date.now() - startTime
      })
      .select()
      .single();

    if (outputError) {
      console.error('Failed to store output:', outputError);
    }

    // Update financial summary
    const settlement = analysisResult.settlement_breakdown || {};
    const { error: financialError } = await supabase
      .from('claim_financial_summary')
      .update({
        rcv_total: settlement.rcv_total || 0,
        acv_paid: settlement.acv_paid || 0,
        depreciation_withheld: settlement.depreciation_withheld || 0,
        deductible_applied: settlement.deductible_applied || 0,
        total_paid_to_date: settlement.acv_paid || 0,
        depreciation_outstanding: settlement.depreciation_withheld || 0,
        structure_total: analysisResult.category_breakdown?.structure?.rcv || 0,
        contents_total: analysisResult.category_breakdown?.contents?.rcv || 0,
        ale_total: analysisResult.category_breakdown?.ale?.total || 0
      })
      .eq('claim_id', body.claim_id);

    if (financialError) {
      console.error('Failed to update financial summary:', financialError);
    }

    // Update step status
    await supabase
      .from('claim_steps')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 13,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id,step_number'
      });

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/analyze-settlement',
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
    console.error('Settlement analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-settlement',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Settlement analysis failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

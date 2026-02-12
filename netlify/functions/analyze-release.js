/**
 * API Endpoint: /analyze-release
 * Analyzes release document for problematic language
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildReleaseAnalysisPrompt } = require('./lib/ai-prompts');

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

    if (!body.release_pdf_url) {
      return sendError('release_pdf_url is required', 'VAL-002', 400);
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

    // Download and parse release PDF
    let releaseText;
    try {
      const response = await fetch(body.release_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download release PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      releaseText = pdfData.text;

      if (!releaseText || releaseText.trim().length < 50) {
        throw new Error('Release PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return sendError('Failed to parse release PDF', 'PDF-001', 400, {
        details: pdfError.message
      });
    }

    // Call OpenAI for release analysis
    let analysisResult;
    try {
      const prompt = buildReleaseAnalysisPrompt(releaseText);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance release document analyst. Return only valid JSON with no additional text.'
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
        step_number: 17,
        output_type: 'release_analysis',
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

    // Update step status
    await supabase
      .from('claim_steps')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 17,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id,step_number'
      });

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/analyze-release',
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
    console.error('Release analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-release',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Release analysis failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

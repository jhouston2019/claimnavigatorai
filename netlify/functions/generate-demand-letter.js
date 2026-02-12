/**
 * API Endpoint: /generate-demand-letter
 * Generates formal demand letter with policy citations
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildDemandLetterPrompt } = require('./lib/ai-prompts');

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

    // Validate claim ownership and get claim info
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id, claim_number, insured_name, policy_number, insurer, date_of_loss, created_at, metadata')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    // Get financial summary
    const { data: financialData, error: financialError } = await supabase
      .from('claim_financial_summary')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    if (financialError || !financialData) {
      return sendError('Financial summary not found. Please run estimate analysis first.', 'DATA-001', 400);
    }

    // Get discrepancy data
    const { data: discrepancies, error: discError } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', body.claim_id)
      .eq('resolved', false);

    if (discError) {
      console.warn('Could not load discrepancies:', discError);
    }

    // Get policy data
    const { data: policyData, error: policyError } = await supabase
      .from('claim_policy_coverage')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    if (policyError) {
      console.warn('Policy data not found, continuing without it');
    }

    // Prepare claim info
    const claimInfo = {
      claim_number: claim.claim_number,
      insured_name: claim.insured_name,
      policy_number: claim.policy_number,
      carrier: claim.insurer,
      loss_date: claim.date_of_loss,
      claim_filed_date: claim.created_at,
      adjuster_name: claim.metadata?.adjuster_name || 'Claims Adjuster',
      adjuster_email: claim.metadata?.adjuster_email || null,
      inspection_date: claim.metadata?.inspection_date || null
    };

    // Prepare discrepancy summary
    const discrepancyData = {
      total_discrepancies: discrepancies?.length || 0,
      total_amount: discrepancies?.reduce((sum, d) => sum + (parseFloat(d.difference_amount) || 0), 0) || 0,
      items: discrepancies?.map(d => ({
        description: d.line_item_description,
        type: d.discrepancy_type,
        contractor_total: d.contractor_total,
        carrier_total: d.carrier_total,
        difference: d.difference_amount,
        category: d.category
      })) || []
    };

    // Call OpenAI for demand letter generation
    let demandResult;
    try {
      const prompt = buildDemandLetterPrompt(claimInfo, discrepancyData, policyData, financialData);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance demand letter writer. Return only valid JSON with no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      demandResult = JSON.parse(responseText);
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      return sendError('AI generation failed', 'AI-001', 500, {
        details: aiError.message
      });
    }

    // Store generated document
    const { data: document, error: docError } = await supabase
      .from('claim_generated_documents')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        document_type: 'demand_letter',
        title: `Demand Letter - ${claim.claim_number}`,
        content_html: demandResult.letter_html,
        content_markdown: demandResult.letter_markdown,
        template_version: '1.0',
        ai_model: 'gpt-4-turbo-preview',
        status: 'draft'
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to store document:', docError);
    }

    // Store output
    const { data: output, error: outputError } = await supabase
      .from('claim_outputs')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 14,
        output_type: 'demand_letter',
        output_json: demandResult,
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
        step_number: 14,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id,step_number'
      });

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/generate-demand-letter',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    return sendSuccess({
      document_id: document?.id,
      output_id: output?.id,
      demand_letter: demandResult,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Demand letter generation error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/generate-demand-letter',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Demand letter generation failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

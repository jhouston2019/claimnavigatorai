/**
 * API Endpoint: /analyze-estimates
 * Compares contractor and carrier estimates line by line
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildEstimateComparisonPrompt } = require('./lib/ai-prompts');

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

    // Download and parse contractor estimate
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

    // Download and parse carrier estimate
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

    // Call OpenAI for estimate comparison
    let comparisonResult;
    try {
      const prompt = buildEstimateComparisonPrompt(contractorText, carrierText);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance estimate analyst. Return only valid JSON with no additional text.'
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
      comparisonResult = JSON.parse(responseText);
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
        step_number: 8,
        output_type: 'estimate_comparison',
        output_json: comparisonResult,
        input_document_ids: [body.contractor_document_id, body.carrier_document_id].filter(Boolean),
        ai_model: 'gpt-4-turbo-preview',
        processing_time_ms: Date.now() - startTime
      })
      .select()
      .single();

    if (outputError) {
      console.error('Failed to store output:', outputError);
    }

    // Store discrepancies
    const discrepancies = [];
    
    // Missing items
    if (comparisonResult.missing_items) {
      for (const item of comparisonResult.missing_items) {
        discrepancies.push({
          claim_id: body.claim_id,
          user_id: userId,
          output_id: output?.id,
          discrepancy_type: 'missing_item',
          line_item_description: item.description,
          contractor_quantity: item.contractor_quantity,
          carrier_quantity: 0,
          contractor_unit_price: item.contractor_unit_price,
          carrier_unit_price: 0,
          contractor_total: item.contractor_total,
          carrier_total: 0,
          difference_amount: item.contractor_total,
          category: item.category,
          notes: item.reason_missing
        });
      }
    }

    // Quantity discrepancies
    if (comparisonResult.quantity_discrepancies) {
      for (const item of comparisonResult.quantity_discrepancies) {
        discrepancies.push({
          claim_id: body.claim_id,
          user_id: userId,
          output_id: output?.id,
          discrepancy_type: 'quantity_difference',
          line_item_description: item.description,
          contractor_quantity: item.contractor_quantity,
          carrier_quantity: item.carrier_quantity,
          contractor_unit_price: item.contractor_unit_price,
          carrier_unit_price: item.carrier_unit_price,
          contractor_total: item.contractor_quantity * item.contractor_unit_price,
          carrier_total: item.carrier_quantity * item.carrier_unit_price,
          difference_amount: item.amount_difference,
          category: item.category
        });
      }
    }

    // Pricing discrepancies
    if (comparisonResult.pricing_discrepancies) {
      for (const item of comparisonResult.pricing_discrepancies) {
        discrepancies.push({
          claim_id: body.claim_id,
          user_id: userId,
          output_id: output?.id,
          discrepancy_type: 'pricing_difference',
          line_item_description: item.description,
          contractor_quantity: item.quantity,
          carrier_quantity: item.quantity,
          contractor_unit_price: item.contractor_unit_price,
          carrier_unit_price: item.carrier_unit_price,
          contractor_total: item.quantity * item.contractor_unit_price,
          carrier_total: item.quantity * item.carrier_unit_price,
          difference_amount: item.amount_difference,
          category: item.category,
          notes: item.reason
        });
      }
    }

    if (discrepancies.length > 0) {
      const { error: discError } = await supabase
        .from('claim_estimate_discrepancies')
        .insert(discrepancies);

      if (discError) {
        console.error('Failed to store discrepancies:', discError);
      }
    }

    // Update financial summary
    const { error: financialError } = await supabase
      .from('claim_financial_summary')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        contractor_total: comparisonResult.contractor_total,
        carrier_total: comparisonResult.carrier_total,
        underpayment_estimate: comparisonResult.underpayment_estimate
      }, {
        onConflict: 'claim_id'
      });

    if (financialError) {
      console.error('Failed to update financial summary:', financialError);
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

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/analyze-estimates',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    return sendSuccess({
      output_id: output?.id,
      comparison: comparisonResult,
      discrepancies_stored: discrepancies.length,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Estimate analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-estimates',
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

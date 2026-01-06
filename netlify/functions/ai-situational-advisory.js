/**
 * AI Situational Advisory Function
 * Provides advisory responses for claim situations
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');


exports.handler = async (event) => {
// ⚠️ PHASE 5B: PROMPT HARDENING REQUIRED
// This function needs manual review to:
// 1. Replace system prompt with getClaimGradeSystemMessage(outputType)
// 2. Enhance user prompt with enhancePromptWithContext(prompt, claimInfo, outputType)
// 3. Post-process response with postProcessResponse(response, outputType)
// 4. Validate with validateProfessionalOutput(response, outputType)
// See: /netlify/functions/PROMPT_HARDENING_GUIDE.md

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-4000', message: 'Method not allowed' } })
      };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Authorization required' } })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Invalid token' } })
      };
    }

    // Check payment status
    const { data: payment } = await supabase
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (!payment) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-3000', message: 'Payment required' } })
      };
    }

    // Unified body parsing
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Invalid JSON body' } })
      };
    }
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-situational-advisory', { payload: body });
    
    validateRequired(body, ['situation_description']);

    const { situation_description, claim_type = 'general' } = body;
    const sanitizedSituation = sanitizeInput(situation_description);

    const startTime = Date.now();

    const systemPrompt = `You are an expert insurance claim advisor. Provide clear, actionable advice for claim situations. Be professional, helpful, and specific.`;

    const userPrompt = `Provide advisory response for this claim situation:

Claim Type: ${claim_type}
Situation: ${sanitizedSituation}

Provide:
1. Advisory response addressing the situation
2. Three specific recommendations
3. Three next steps

Return JSON:
{
  "response": "Advisory response text",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;

    const response = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1500
    });

    let result;
    try {
      result = JSON.parse(response);
    } catch (e) {
      result = {
        response: response,
        recommendations: extractList(response, 'recommendation'),
        next_steps: extractList(response, 'next step')
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-situational-advisory',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-situational-advisory',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-situational-advisory',
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};

function extractList(text, keyword) {
  const items = [];
  const lines = text.split('\n');
  let inSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword)) inSection = true;
    if (inSection && line.match(/^\d+[\.\)]\s*(.+)$/)) {
      items.push(line.replace(/^\d+[\.\)]\s*/, '').trim());
    }
  }
  return items.slice(0, 3);
}



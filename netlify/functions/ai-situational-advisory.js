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
  // ✅ PHASE 5B: FULLY HARDENED

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    
    // PHASE 5B: Post-process and validate
    const processedResponse = postProcessResponse(rawResponse, 'analysis');
    const validation = validateProfessionalOutput(processedResponse, 'analysis');

    if (!validation.pass) {
      console.warn('[ai-situational-advisory] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-situational-advisory', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

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

    const { situation_description, claim_type = 'general', claimInfo = {} } = body;
    const sanitizedSituation = sanitizeInput(situation_description);

    const startTime = Date.now();

    const systemMessage = getClaimGradeSystemMessage('analysis');

    let userPrompt = `Provide advisory response for this claim situation:

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

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    const processedResponse = await runOpenAI(systemMessage.content, userPrompt, {
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
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
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



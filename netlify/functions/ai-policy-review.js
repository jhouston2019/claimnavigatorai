/**
 * AI Policy Review Function
 * Reviews and analyzes insurance policies
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
    await LOG_EVENT('ai_request', 'ai-policy-review', { payload: body });

    validateRequired(body, ['policy_text']);

    const { policy_text, policy_type = '', jurisdiction = '', deductible = '', claimInfo = {} } = body;
    const sanitizedText = sanitizeInput(policy_text);

    const startTime = Date.now();

    // PHASE 5B: Use claim-grade system message
    const systemMessage = getClaimGradeSystemMessage('analysis');

    let userPrompt = `Analyze this insurance policy:

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}
Deductible: ${deductible}

Policy Text:
${sanitizedText}

Provide:
1. Coverage summary
2. Key exclusions
3. Recommendations
4. Important deadlines

Format as HTML for display.`;

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    const rawAnalysis = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // PHASE 5B: Post-process and validate
    const processedAnalysis = postProcessResponse(rawAnalysis, 'analysis');
    const validation = validateProfessionalOutput(processedAnalysis, 'analysis');

    if (!validation.pass) {
      console.warn('[ai-policy-review] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-policy-review', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      html: processedAnalysis,
      summary: extractSummary(processedAnalysis),
      exclusions: extractExclusions(processedAnalysis),
      recommendations: extractRecommendations(processedAnalysis)
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-policy-review',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-policy-review',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: result,
        metadata: {
          quality_score: validation.score,
          validation_passed: validation.pass
        },
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-policy-review',
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

function extractSummary(text) {
  const match = text.match(/summary[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : text.substring(0, 200);
}

function extractExclusions(text) {
  const exclusions = [];
  const lines = text.split('\n');
  let inExclusions = false;
  for (const line of lines) {
    if (line.match(/exclusion/i)) inExclusions = true;
    if (inExclusions && line.match(/^[-•]\s*(.+)$/)) {
      exclusions.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return exclusions.slice(0, 10);
}

function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  let inRecommendations = false;
  for (const line of lines) {
    if (line.match(/recommendation/i)) inRecommendations = true;
    if (inRecommendations && line.match(/^[-•]\s*(.+)$/)) {
      recommendations.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return recommendations.slice(0, 5);
}



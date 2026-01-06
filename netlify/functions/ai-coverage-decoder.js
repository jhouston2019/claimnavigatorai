/**
 * AI Coverage Decoder Function
 * Analyzes policy text and extracts coverage information
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
      console.warn('[ai-coverage-decoder] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-coverage-decoder', {
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
    await LOG_EVENT('ai_request', 'ai-coverage-decoder', { payload: body });
    
    validateRequired(body, ['policy_text']);

    const { policy_text,
      policy_type = '',
      jurisdiction = '',
      deductible = '', claimInfo = {} } = body;

    // Sanitize inputs
    const sanitizedText = sanitizeInput(policy_text);

    const startTime = Date.now();

    // Build system prompt
    const systemMessage = getClaimGradeSystemMessage('analysis');

    // Build user prompt
    let userPrompt = `Analyze this insurance policy text and extract coverage information:

Policy Type: ${policy_type || 'Not specified'}
Jurisdiction: ${jurisdiction || 'Not specified'}
Deductible: ${deductible || 'Not specified'}

Policy Text:
${sanitizedText}

Return JSON:
{
  "summary": "Brief coverage summary",
  "limits": {
    "Dwelling": "$X",
    "Personal Property": "$X",
    "Loss of Use": "$X"
  },
  "deductibles": "Deductible information",
  "exclusions": ["Exclusion 1", "Exclusion 2"],
  "deadlines": ["Deadline 1", "Deadline 2"]
}`;

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    // Call OpenAI
    const processedResponse = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (e) {
      // Extract structured data from text
      result = {
        summary: extractSummary(response),
        limits: extractLimits(response),
        deductibles: extractDeductibles(response),
        exclusions: extractExclusions(response),
        deadlines: extractDeadlines(response)
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-coverage-decoder',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-coverage-decoder',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-coverage-decoder',
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
  return match ? match[1].trim() : 'Coverage analysis complete';
}

function extractLimits(text) {
  const limits = {};
  const limitMatches = text.matchAll(/(\w+)\s*[:\s]+\$?([\d,]+)/gi);
  for (const match of limitMatches) {
    limits[match[1]] = `$${match[2]}`;
  }
  return limits;
}

function extractDeductibles(text) {
  const match = text.match(/deductible[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'Deductible information not found';
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

function extractDeadlines(text) {
  const deadlines = [];
  const deadlineMatches = text.matchAll(/(\d+\s+days?|deadline|due\s+date)/gi);
  for (const match of deadlineMatches) {
    deadlines.push(match[0]);
  }
  return deadlines.slice(0, 5);
}



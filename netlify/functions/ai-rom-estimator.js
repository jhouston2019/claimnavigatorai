/**
 * AI ROM Estimator Function
 * Calculates repair/replacement cost estimates
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
      console.warn('[ai-rom-estimator] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-rom-estimator', {
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
    await LOG_EVENT('ai_request', 'ai-rom-estimator', { payload: body });
    
    validateRequired(body, ['category', 'severity', 'square_feet']);

    const { category, severity, square_feet, claimInfo = {} } = body;

    const startTime = Date.now();

    // Base rates per sq ft by category
    const baseRates = {
      fire: 150,
      water: 120,
      roof: 200,
      contents: 80,
      structural: 250
    };

    // Severity multipliers
    const severityMultipliers = {
      minor: 0.5,
      moderate: 1.0,
      severe: 2.0,
      total_loss: 3.5
    };

    const baseRate = baseRates[category] || 150;
    const multiplier = severityMultipliers[severity] || 1.0;
    const baseEstimate = baseRate * square_feet * multiplier;

    // Build AI prompt for explanation
    const systemMessage = getClaimGradeSystemMessage('analysis');

    let userPrompt = `Explain this repair/replacement cost estimate:

Category: ${category}
Severity: ${severity}
Square Feet: ${square_feet.toLocaleString()}
Base Rate: ${baseRate} per sq ft
Severity Multiplier: ${multiplier}x
Estimated Cost: ${baseEstimate.toLocaleString()}

Provide:
1. A clear explanation of the estimate
2. What factors influenced the calculation
3. What this estimate typically covers
4. Any important considerations

Keep it professional and informative.`;

    const explanation = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 500
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      estimate: Math.round(baseEstimate),
      explanation: explanation,
      breakdown: {
        square_feet: square_feet,
        base_rate: baseRate,
        severity_multiplier: multiplier,
        calculation: `$${baseRate} × ${square_feet.toLocaleString()} sq ft × ${multiplier}x = $${Math.round(baseEstimate).toLocaleString()}`
      }
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-rom-estimator',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-rom-estimator',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-rom-estimator',
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



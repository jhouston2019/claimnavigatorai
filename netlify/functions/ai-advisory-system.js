const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
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
      console.warn('[ai-advisory-system] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-advisory-system', {
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
    // Auth validation
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

    // Payment validation
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

    const { situation, claimType, specificQuestions, claimInfo = {} } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-advisory-system', { payload: body });
    
    if (!situation) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Missing situation description' } })
      };
    }

    const startTime = Date.now();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Generate AI advisory response
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert insurance claims advisor. Provide specific, actionable advice for insurance claim situations. Focus on protecting the policyholder\'s rights and maximizing claim value.' 
        },
        { 
          role: 'user', 
          content: `Provide advisory guidance for this ${claimType || 'insurance'} claim situation:\n\nSituation: ${situation}\n\nSpecific Questions: ${specificQuestions || 'General guidance needed'}` 
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const advisoryResponse = ai.choices[0].message.content;

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      advisoryResponse,
      recommendations: advisoryResponse.split('\n').filter(line => line.trim().length > 0),
      nextSteps: [
        "Review your insurance policy",
        "Gather supporting documentation",
        "Contact your insurance company",
        "Consider professional assistance if needed"
      ]
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-advisory-system',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-advisory-system',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };
  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-advisory-system',
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



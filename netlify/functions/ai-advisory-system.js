const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { 
      statusCode: 401, 
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { situation, claimType, specificQuestions } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-advisory-system', { payload: body });
    
    if (!situation) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing situation description' }) 
      };
    }

    const startTime = Date.now();

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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, data: result, error: null })
    };
  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-advisory-system',
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};



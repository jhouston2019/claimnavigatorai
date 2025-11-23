/**
 * AI Situational Advisory Function
 * Provides advisory responses for claim situations
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
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
        body: JSON.stringify({ error: 'Invalid token' })
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
        body: JSON.stringify({ error: 'Payment required' })
      };
    }

    // Parse request
    const body = JSON.parse(event.body || '{}');
    validateRequired(body, ['situation_description']);

    const { situation_description, claim_type = 'general' } = body;
    const sanitizedSituation = sanitizeInput(situation_description);

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };

  } catch (error) {
    console.error('AI Situational Advisory error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
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



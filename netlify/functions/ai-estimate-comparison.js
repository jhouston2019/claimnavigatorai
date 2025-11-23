/**
 * AI Estimate Comparison Function
 */

const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
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

    const body = JSON.parse(event.body || '{}');
    const { estimates = [], labor_rate = '', tax_rate = '', include_overhead = false, notes = '' } = body;

    if (estimates.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No estimates provided' })
      };
    }

    const systemPrompt = `You are an expert construction cost estimator. Compare multiple estimates and identify discrepancies, validate pricing, and provide recommendations.`;

    const estimatesText = estimates.map((est, idx) => 
      `Estimate ${idx + 1} (${est.filename}):\n${sanitizeInput(est.text).substring(0, 5000)}`
    ).join('\n\n---\n\n');

    const userPrompt = `Compare these contractor estimates:

${estimatesText}

Labor Rate: ${labor_rate || 'Not specified'}
Tax Rate: ${tax_rate || 'Not specified'}
Include Overhead: ${include_overhead ? 'Yes' : 'No'}
Notes: ${sanitizeInput(notes)}

Provide:
1. Comparison summary
2. Price discrepancies identified
3. Validation of pricing
4. Recommendations

Format as HTML.`;

    const comparison = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: comparison,
          comparison: comparison,
          estimate_count: estimates.length
        }
      })
    };

  } catch (error) {
    console.error('AI Estimate Comparison error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};



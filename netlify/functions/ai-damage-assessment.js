/**
 * AI Damage Assessment Function
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
    const { damage_description = '', damage_types = [], damage_items = [] } = body;

    const systemPrompt = `You are a professional damage assessment expert. Analyze property damage and provide detailed assessments with cost breakdowns.`;

    const totalCost = damage_items.reduce((sum, item) => sum + (item.total || 0), 0);

    const userPrompt = `Analyze this damage assessment:

Description: ${sanitizeInput(damage_description)}
Damage Types: ${damage_types.join(', ') || 'Not specified'}
Items: ${JSON.stringify(damage_items)}
Total Cost: $${totalCost.toLocaleString()}

Provide:
1. Damage assessment summary
2. Cost breakdown analysis
3. Recommendations for repair/replacement
4. Important considerations

Format as HTML.`;

    const assessment = await runOpenAI(systemPrompt, userPrompt, {
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
          html: assessment,
          assessment: assessment,
          total_cost: totalCost,
          item_count: damage_items.length
        }
      })
    };

  } catch (error) {
    console.error('AI Damage Assessment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};



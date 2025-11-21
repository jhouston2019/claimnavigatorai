/**
 * AI Negotiation Advisor Function
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
    const {
      offer_amount = 0,
      valuation = 0,
      gap = 0,
      gap_percent = 0,
      disputed_categories = '',
      jurisdiction = '',
      days_since_claim = '',
      policy_limits = '',
      context = ''
    } = body;

    const systemPrompt = `You are an expert insurance negotiation advisor. Analyze settlement offers and provide strategic negotiation advice.`;

    const userPrompt = `Analyze this settlement situation:

Offer Amount: $${offer_amount.toLocaleString()}
Your Valuation: $${valuation.toLocaleString()}
Gap: $${gap.toLocaleString()} (${gap_percent.toFixed(1)}%)
Disputed Categories: ${sanitizeInput(disputed_categories)}
Jurisdiction: ${jurisdiction || 'Not specified'}
Days Since Claim: ${days_since_claim || 'Not specified'}
Policy Limits: ${policy_limits ? `$${policy_limits}` : 'Not specified'}
Context: ${sanitizeInput(context)}

Provide:
1. Settlement analysis
2. Gap assessment
3. Negotiation strategy
4. Counter-offer recommendations
5. Important considerations

Format as HTML.`;

    const analysis = await runOpenAI(systemPrompt, userPrompt, {
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
          html: analysis,
          analysis: analysis,
          gap: gap,
          gap_percent: gap_percent,
          recommended_counter: valuation * 0.95 // 5% negotiation room
        }
      })
    };

  } catch (error) {
    console.error('AI Negotiation Advisor error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};


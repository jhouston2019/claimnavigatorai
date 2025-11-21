/**
 * AI ROM Estimator Function
 * Calculates repair/replacement cost estimates
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
    
    validateRequired(body, ['category', 'severity', 'square_feet']);

    const { category, severity, square_feet } = body;

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
    const systemPrompt = `You are a construction cost estimator. Provide clear, professional explanations of repair/replacement cost estimates.`;

    const userPrompt = `Explain this repair/replacement cost estimate:

Category: ${category}
Severity: ${severity}
Square Feet: ${square_feet.toLocaleString()}
Base Rate: $${baseRate} per sq ft
Severity Multiplier: ${multiplier}x
Estimated Cost: $${baseEstimate.toLocaleString()}

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          estimate: Math.round(baseEstimate),
          explanation: explanation,
          breakdown: {
            square_feet: square_feet,
            base_rate: baseRate,
            severity_multiplier: multiplier,
            calculation: `$${baseRate} × ${square_feet.toLocaleString()} sq ft × ${multiplier}x = $${Math.round(baseEstimate).toLocaleString()}`
          }
        }
      })
    };

  } catch (error) {
    console.error('AI ROM Estimator error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};


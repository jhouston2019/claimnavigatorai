const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { claim_id, category, severity, square_feet } = JSON.parse(event.body);

    if (!category || !severity || !square_feet) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: category, severity, and square_feet are required' 
        })
      };
    }

    // Base rates per square foot for different damage categories
    const baseRates = {
      fire: 55,
      water: 40,
      roof: 35,
      contents: 25,
      structural: 70
    };

    // Severity multipliers
    const severityMultiplier = {
      minor: 0.8,
      moderate: 1.0,
      severe: 1.3,
      total_loss: 1.8
    };

    const rate = baseRates[category] || 50;
    const multiplier = severityMultiplier[severity] || 1;
    const estimate = Math.round(square_feet * rate * multiplier);

    // Generate AI explanation
    let explanation = '';
    try {
      const prompt = `Explain this insurance repair estimate in 3 concise sentences:
      Category: ${category}
      Severity: ${severity}
      Square Feet: ${square_feet}
      Estimated Cost: $${estimate.toLocaleString()}

      Provide a clear, professional explanation that helps the policyholder understand the estimate.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      explanation = completion.choices[0].message.content.trim();
    } catch (aiError) {
      console.warn('AI explanation failed, using default:', aiError);
      explanation = `This estimate is based on ${square_feet} square feet of ${severity} ${category} damage. The calculation uses industry-standard rates adjusted for severity level.`;
    }

    // Log to Supabase
    try {
      const { error: insertError } = await supabase.from('rom_estimates').insert([
        {
          claim_id: claim_id || 'TEST-CLAIM',
          category,
          severity,
          square_feet: parseFloat(square_feet),
          estimated_cost: estimate,
          ai_explanation: explanation
        }
      ]);

      if (insertError) {
        console.warn('Supabase insert failed:', insertError);
      }
    } catch (dbError) {
      console.warn('Database logging failed:', dbError);
      // Continue even if logging fails
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'success',
        estimate,
        explanation,
        breakdown: {
          square_feet: parseFloat(square_feet),
          base_rate: rate,
          severity_multiplier: multiplier,
          calculation: `${square_feet} × $${rate} × ${multiplier} = $${estimate}`
        }
      })
    };
  } catch (err) {
    console.error('ROM estimate error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'error',
        error: err.message 
      })
    };
  }
};


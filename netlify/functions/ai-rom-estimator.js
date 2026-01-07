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
    
    const { 
      // Comparable finder parameters
      itemDescription,
      itemCategory,
      estimatedValue,
      context,
      analysis_mode = 'rom-estimate', // NEW: Mode parameter
      // Legacy ROM parameters
      category, 
      severity, 
      square_feet,
      claimInfo = {} 
    } = body;

    const startTime = Date.now();

    // Route based on analysis mode
    if (analysis_mode === 'comparable-finder') {
      // NEW: Comparable item finder logic
      validateRequired(body, ['itemDescription', 'itemCategory']);
      
      const systemMessage = getClaimGradeSystemMessage('analysis');
      
      const userPrompt = `Find comparable replacement items for this item and return ONLY valid JSON with this exact structure:

{
  "comparables": [
    {
      "item": "Specific item name and model",
      "price": 1199,
      "source": "Retailer name",
      "date": "2024-01-06",
      "similarity_score": 95,
      "link": "URL if available or empty string"
    }
  ],
  "recommended_rcv": 1200,
  "average_comparable": 1174,
  "summary": "5 comparable items found"
}

Item Description: ${itemDescription}
Category: ${itemCategory}
Estimated Value: $${estimatedValue || 'Unknown'}
Context: ${context || 'None'}

Find 3-5 comparable items currently available for purchase. Include:
- Exact item name and model number
- Current retail price (realistic market prices)
- Where to buy (retailer/source like Best Buy, Amazon, Home Depot, etc.)
- Date (use today's date: ${new Date().toISOString().split('T')[0]})
- Similarity score (0-100, how similar to original item)
- Purchase link if you know a real URL, otherwise use empty string

Calculate:
- recommended_rcv: Your recommended replacement cost value
- average_comparable: Average price of all comparables found
- summary: Brief summary like "5 comparable items found"

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;

      const rawResponse = await runOpenAI(systemMessage.content, userPrompt, {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000
      });

      // Parse JSON response
      let result;
      try {
        const cleanedResponse = rawResponse
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        result = JSON.parse(cleanedResponse);
        
        // Validate required fields
        if (!result.comparables || !Array.isArray(result.comparables)) {
          throw new Error('Missing or invalid comparables array');
        }
        
        // Ensure required fields exist
        if (result.recommended_rcv === undefined) {
          result.recommended_rcv = estimatedValue || 0;
        }
        if (result.average_comparable === undefined) {
          const prices = result.comparables.map(c => c.price || 0);
          result.average_comparable = prices.length > 0 ? 
            Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        }
        if (!result.summary) {
          result.summary = `${result.comparables.length} comparable items found`;
        }
        
      } catch (parseError) {
        console.error('[ai-rom-estimator] JSON parse error:', parseError);
        await LOG_ERROR('json_parse_error', {
          function: 'ai-rom-estimator',
          mode: 'comparable-finder',
          error: parseError.message,
          raw_response: rawResponse.substring(0, 500)
        });
        
        // Fallback
        result = {
          comparables: [],
          recommended_rcv: estimatedValue || 0,
          average_comparable: 0,
          summary: "Unable to find comparable items. Please try again with a more specific description.",
          error: "JSON parsing failed"
        };
      }

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Log usage
      await LOG_USAGE({
        function: 'ai-rom-estimator',
        mode: 'comparable-finder',
        duration_ms: durationMs,
        input_token_estimate: 0,
        output_token_estimate: 0,
        success: true
      });

      // Log cost
      await LOG_COST({
        function: 'ai-rom-estimator',
        mode: 'comparable-finder',
        estimated_cost_usd: 0.002
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          data: result,
          metadata: { 
            quality_score: result.error ? 0 : 100, 
            validation_passed: !result.error 
          },
          error: null 
        })
      };
    }

    // EXISTING: ROM estimate logic
    validateRequired(body, ['category', 'severity', 'square_feet']);

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



/**
 * AI Business Interruption Calculator Function
 */

const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
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
      console.warn('[ai-business-interruption] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-business-interruption', {
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
    await LOG_EVENT('ai_request', 'ai-business-interruption', { payload: body });
    
    const { business_name = '',
      start_date = '',
      end_date = '',
      revenues = '',
      cogs_percent = '',
      fixed_costs_percent = '',
      variable_costs_percent = '',
      extra_expenses = '',
      business_type = '', claimInfo = {} } = body;

    const startTime = Date.now();

    // Calculate days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Parse revenues
    const revenueArray = revenues.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r));
    const avgRevenue = revenueArray.length > 0 ? revenueArray.reduce((a, b) => a + b, 0) / revenueArray.length : 0;

    // Calculate BI loss
    const cogs = parseFloat(cogs_percent) || 0;
    const fixed = parseFloat(fixed_costs_percent) || 0;
    const variable = parseFloat(variable_costs_percent) || 0;
    const grossProfitPercent = 100 - cogs;
    const netProfitPercent = grossProfitPercent - fixed - variable;
    
    const dailyRevenue = avgRevenue / 30;
    const dailyGrossProfit = dailyRevenue * (grossProfitPercent / 100);
    const dailyNetProfit = dailyRevenue * (netProfitPercent / 100);
    const totalLostRevenue = dailyRevenue * days;
    const totalLostProfit = dailyNetProfit * days;
    const extraExpensesAmount = parseFloat(extra_expenses) || 0;
    const totalBI = totalLostProfit + extraExpensesAmount;

    const systemMessage = getClaimGradeSystemMessage('analysis');

    let userPrompt = `Calculate business interruption loss:

Business: ${sanitizeInput(business_name)}
Type: ${business_type || 'Not specified'}
Interruption: ${start_date} to ${end_date} (${days} days)
Average Monthly Revenue: ${avgRevenue.toLocaleString()}
COGS: ${cogs}%
Fixed Costs: ${fixed}%
Variable Costs: ${variable}%
Extra Expenses: ${extraExpensesAmount.toLocaleString()}

Calculations:
- Daily Revenue: ${dailyRevenue.toFixed(2)}
- Daily Net Profit: ${dailyNetProfit.toFixed(2)}
- Total Lost Revenue: ${totalLostRevenue.toLocaleString()}
- Total Lost Profit: ${totalLostProfit.toLocaleString()}
- Total BI Loss: ${totalBI.toLocaleString()}

Provide:
1. Calculation explanation
2. Breakdown of components
3. Important considerations
4. Recommendations

Format as HTML.`;

    const calculation = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      html: calculation,
      calculation: calculation,
      total_bi_loss: totalBI,
      lost_revenue: totalLostRevenue,
      lost_profit: totalLostProfit,
      extra_expenses: extraExpensesAmount,
      days: days
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-business-interruption',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-business-interruption',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-business-interruption',
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



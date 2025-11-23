/**
 * AI Business Interruption Calculator Function
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
      business_name = '',
      start_date = '',
      end_date = '',
      revenues = '',
      cogs_percent = '',
      fixed_costs_percent = '',
      variable_costs_percent = '',
      extra_expenses = '',
      business_type = ''
    } = body;

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

    const systemPrompt = `You are a forensic accounting expert specializing in business interruption claims. Calculate and explain BI losses professionally.`;

    const userPrompt = `Calculate business interruption loss:

Business: ${sanitizeInput(business_name)}
Type: ${business_type || 'Not specified'}
Interruption: ${start_date} to ${end_date} (${days} days)
Average Monthly Revenue: $${avgRevenue.toLocaleString()}
COGS: ${cogs}%
Fixed Costs: ${fixed}%
Variable Costs: ${variable}%
Extra Expenses: $${extraExpensesAmount.toLocaleString()}

Calculations:
- Daily Revenue: $${dailyRevenue.toFixed(2)}
- Daily Net Profit: $${dailyNetProfit.toFixed(2)}
- Total Lost Revenue: $${totalLostRevenue.toLocaleString()}
- Total Lost Profit: $${totalLostProfit.toLocaleString()}
- Total BI Loss: $${totalBI.toLocaleString()}

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: calculation,
          calculation: calculation,
          total_bi_loss: totalBI,
          lost_revenue: totalLostRevenue,
          lost_profit: totalLostProfit,
          extra_expenses: extraExpensesAmount,
          days: days
        }
      })
    };

  } catch (error) {
    console.error('AI Business Interruption error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};



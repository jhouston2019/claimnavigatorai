const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { claimAmount, deductible, outOfPocket, lostWages, additionalExpenses } = JSON.parse(event.body || '{}');
    
    if (!claimAmount) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing claim amount' }) 
      };
    }

    const netClaimAmount = claimAmount - (deductible || 0);
    const totalFinancialImpact = netClaimAmount + (lostWages || 0) + (additionalExpenses || 0);
    const outOfPocketTotal = (deductible || 0) + (outOfPocket || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        financialImpact: {
          claimAmount,
          deductible: deductible || 0,
          netClaimAmount,
          lostWages: lostWages || 0,
          additionalExpenses: additionalExpenses || 0,
          outOfPocketTotal,
          totalFinancialImpact
        }
      })
    };
  } catch (error) {
    console.error('Financial impact calculation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Financial impact calculation failed' })
    };
  }
};



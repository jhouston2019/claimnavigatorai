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
    const { originalOffer, counterOffer, additionalCosts } = JSON.parse(event.body || '{}');
    
    if (!originalOffer || !counterOffer) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing offer amounts' }) 
      };
    }

    const difference = counterOffer - originalOffer;
    const percentageIncrease = ((counterOffer - originalOffer) / originalOffer) * 100;
    const totalWithCosts = counterOffer + (additionalCosts || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        comparison: {
          originalOffer,
          counterOffer,
          difference,
          percentageIncrease: percentageIncrease.toFixed(2),
          additionalCosts: additionalCosts || 0,
          totalWithCosts
        }
      })
    };
  } catch (error) {
    console.error('Settlement comparison error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Settlement comparison failed' })
    };
  }
};



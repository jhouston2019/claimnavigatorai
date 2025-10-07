const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Test basic Stripe connection
    const account = await stripe.accounts.retrieve();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
      })
    };

  } catch (error) {
    console.error('Stripe test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        code: error.type || 'STRIPE_ERROR',
        details: error.message
      })
    };
  }
};

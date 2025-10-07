const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'STRIPE_SECRET_KEY not configured',
          code: 'CONFIG_ERROR'
        })
      };
    }

    // Test basic Stripe connection
    const account = await stripe.accounts.retrieve();
    
    // Try to create a simple checkout session and capture the exact error
    let checkoutResult = null;
    let checkoutError = null;
    
    try {
      checkoutResult = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'https://claimnavigatorai.com/success',
        cancel_url: 'https://claimnavigatorai.com',
      });
    } catch (error) {
      checkoutError = {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        decline_code: error.decline_code,
        payment_intent: error.payment_intent,
        raw: error.toString()
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        account: {
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          country: account.country,
          defaultCurrency: account.default_currency,
          businessType: account.business_type
        },
        checkoutResult: checkoutResult ? { id: checkoutResult.id, url: checkoutResult.url } : null,
        checkoutError: checkoutError,
        keyFormat: process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : 
                   process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'unknown'
      })
    };

  } catch (error) {
    console.error('Stripe debug error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        code: error.type || 'STRIPE_ERROR',
        details: error.toString()
      })
    };
  }
};

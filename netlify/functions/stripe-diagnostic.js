const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Basic Stripe connection
    const account = await stripe.accounts.retrieve();
    
    // Test 2: Try to create a minimal checkout session
    let checkoutTest = null;
    let checkoutError = null;
    
    try {
      checkoutTest = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 100, // $1.00
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
        param: error.param
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
          businessType: account.business_type,
          requirements: account.requirements
        },
        checkoutTest: checkoutTest ? { id: checkoutTest.id, url: checkoutTest.url } : null,
        checkoutError: checkoutError
      })
    };

  } catch (error) {
    console.error('Stripe diagnostic error:', error);
    
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

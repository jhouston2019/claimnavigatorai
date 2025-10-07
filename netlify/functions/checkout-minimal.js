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

    // Create the most basic Stripe checkout session possible
    const session = await stripe.checkout.sessions.create({
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      })
    };

  } catch (error) {
    console.error('Stripe error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        code: 'STRIPE_ERROR',
        type: error.type,
        details: error.message
      })
    };
  }
};

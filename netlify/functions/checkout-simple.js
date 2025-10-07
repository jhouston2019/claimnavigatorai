const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
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

    // Determine the site URL dynamically
    const siteUrl = process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com';
    
    // Create a simple Stripe checkout session without complex custom fields
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'ClaimNavigatorAI Toolkit',
            description: 'AI-powered claim documentation package (20 AI responses included). Digital product - delivered immediately upon payment.',
          },
          unit_amount: 99700, // $997.00 in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: siteUrl,
      metadata: {
        product: 'claim_toolkit',
        ai_responses: '20',
        terms_version: '1.0',
        privacy_version: '1.0'
      },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true
      },
      customer_creation: 'always'
    });

    console.log(`Simple checkout session created: ${session.id}`);

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
        details: error.type || 'Unknown error'
      })
    };
  }
};

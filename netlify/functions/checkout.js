const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

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
          error: 'Payment configuration error. Please contact support.',
          code: 'AUTH_ERROR'
        })
      };
    }

    // Parse request body if present
    let email = undefined;
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        email = body.email;
      } catch (e) {
        // Ignore parse errors, email is optional
      }
    }

    // Determine site URL
    const siteUrl = process.env.SITE_URL || 'https://claimnavigatorai.com';

    // Create Stripe checkout session with minimal configuration
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
        ai_responses: '20'
      },
      customer_email: email,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true
      },
      customer_creation: 'always'
    });

    console.log('Stripe session created:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        url: session.url
      })
    };

  } catch (error) {
    console.error('Checkout error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Payment configuration error. Please contact support.',
          code: 'AUTH_ERROR'
        })
      };
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request. Please try again.',
          code: 'INVALID_REQUEST'
        })
      };
    }
    
    if (error.type === 'StripeAPIError') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Payment service temporarily unavailable. Please try again.',
          code: 'API_ERROR'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Checkout failed. Please try again.',
        code: 'CHECKOUT_ERROR',
        details: error.message
      })
    };
  }
};
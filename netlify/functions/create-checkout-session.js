/**
 * Create Stripe Checkout Session
 * Creates a checkout session for ClaimNavigatorAI access
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const priceId = process.env.STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT;

    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Price ID not configured' }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/cancel.html`,
    });

    return {
      statusCode: 302,
      headers: {
        Location: session.url,
      },
    };
  } catch (error) {
    console.error('Checkout session error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};


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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { priceId, userEmail } = JSON.parse(event.body || '{}');

    // Use default price if not provided
    const finalPriceId = priceId || process.env.STRIPE_PRICE_CLAIM_NAVIGATOR;

    if (!finalPriceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Price ID not configured' })
      };
    }

    const siteUrl = process.env.SITE_URL || 'https://claimnavigatorai.com';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1
        }
      ],
      customer_email: userEmail || undefined,
      success_url: `${siteUrl}/app/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app/pricing.html`,
      metadata: {
        product: 'claim_navigator_toolkit'
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id })
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


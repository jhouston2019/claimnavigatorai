/**
 * Netlify Function: Create Stripe Checkout Session (Guest/No Auth Required)
 * Allows users to checkout directly from pricing page without login
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY not configured");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Payment system not configured" })
    };
  }

  try {
    const { source } = JSON.parse(event.body || "{}");

    // Create Stripe Checkout Session
    // Stripe will collect email during checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Claim Navigator - Complete Toolkit',
              description: 'One claim toolkit with all professional tools'
            },
            unit_amount: 49700 // $497.00 in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.URL || 'http://localhost:8888'}/claim/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:8888'}/marketing/pricing.html`,
      // Stripe will collect email - no customer_email pre-filled
      // After payment, user will be prompted to create account
      metadata: {
        type: 'claim_purchase',
        source: source || 'pricing_page'
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create checkout session' })
    };
  }
};


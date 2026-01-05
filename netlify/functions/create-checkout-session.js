/**
 * Netlify Function: Create Stripe Checkout Session
 * Phase 18 - Stripe Paywall
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { user_id, email } = JSON.parse(event.body);

    if (!user_id || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Claim Navigator - One Claim',
              description: 'Unlock one complete claim toolkit with all professional tools'
            },
            unit_amount: 9900 // $99.00 in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.URL || 'http://localhost:8888'}/claim/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:8888'}/marketing/pricing.html`,
      metadata: {
        user_id: user_id,
        type: 'claim_purchase'
      },
      customer_email: email
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' })
    };
  }
};

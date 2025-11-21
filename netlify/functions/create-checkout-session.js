/**
 * Create Stripe Checkout Session
 * Creates a checkout session for ClaimNavigatorAI access
 */

exports.handler = async (event, context) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const priceId = process.env.STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT;

    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Price ID not configured" })
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      success_url: `${process.env.URL}/checkout-success.html`,
      cancel_url: `${process.env.URL}/`,
    });

    return {
      statusCode: 302,
      headers: {
        Location: session.url
      }
    };
  } catch (error) {
    console.error('Checkout session error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};


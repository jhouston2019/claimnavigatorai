const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const priceId = process.env.STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT;
    
    if (!priceId) {
      throw new Error("STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT environment variable not set");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      success_url: `${process.env.STRIPE_CHECKOUT_SUCCESS_URL || 'https://claimnavigatorai.com/success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CHECKOUT_CANCEL_URL || 'https://claimnavigatorai.com',
    });

    console.log("✅ Stripe session created:", session.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error("❌ Checkout error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
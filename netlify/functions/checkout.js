const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "ClaimNavigatorAI Toolkit",
            description: "AI-powered claim documentation package (20 AI responses included). Digital product - delivered immediately upon payment.",
          },
          unit_amount: 99700, // $997.00 in cents
        },
        quantity: 1,
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
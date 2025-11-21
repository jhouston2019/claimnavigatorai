exports.handler = async (event, context) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const priceId = process.env.STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/checkout-success.html`,
      cancel_url: `${process.env.SITE_URL}/`,
    });

    return {
      statusCode: 302,
      headers: {
        Location: session.url,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};


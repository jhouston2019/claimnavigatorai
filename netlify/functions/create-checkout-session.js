const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { userEmail } = JSON.parse(event.body);

    if (!userEmail) {
      return { statusCode: 400, body: "Missing user email" };
    }

    // Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail, // ties checkout to logged-in email
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "ClaimNavigatorAI – 20 Document Credits",
            },
            unit_amount: 49900, // $499.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/app/receipt.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/product.html?canceled=true`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

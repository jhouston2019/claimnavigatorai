const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { session_id } = JSON.parse(event.body);
    if (!session_id) {
      return { statusCode: 400, body: "Missing session_id" };
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "line_items"],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: session.id,
        amount_total: (session.amount_total / 100).toFixed(2),
        currency: session.currency.toUpperCase(),
        email: session.customer_email,
        payment_status: session.payment_status,
        created: new Date(session.created * 1000).toISOString(),
        product: session.line_items?.data[0]?.description || "AI Claim Toolkit",
      }),
    };
  } catch (err) {
    console.error("Error fetching checkout session:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { session_id } = JSON.parse(event.body);

    if (!session_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing session_id" }),
      };
    }

    // Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Session not found" }),
      };
    }

    // Return session details for receipt display
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: session.id,
        created: session.created,
        product: session.metadata?.product || "ClaimNavigatorAI Toolkit",
        amount_total: session.amount_total,
        customer_email: session.customer_email,
        payment_status: session.payment_status
      }),
    };
  } catch (err) {
    console.error("Error retrieving checkout session:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};

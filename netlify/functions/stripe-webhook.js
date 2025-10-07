const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  try {
    const evt = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (evt.type === "checkout.session.completed") {
      const email = evt.data.object.customer_details?.email;

      if (email) {
        console.log("✅ Stripe checkout complete for:", email);

        // Send Supabase Auth invite
        const resp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/invite`, {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await resp.json();
        console.log("✅ Supabase invite response:", data);
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const userEmail = session.customer_email;
      const affiliateID = session.metadata?.affiliateID || null;
      const product = session.metadata?.product || "Unknown Product";
      const amount = session.amount_total / 100; // convert cents to dollars

      // Update entitlements (grant credits)
      await supabase.from("entitlements").upsert(
        { email: userEmail, credits: 20 },
        { onConflict: "email" }
      );

      // Update transaction to mark paid
      const { error } = await supabase
        .from("transactions")
        .update({ payout_status: "pending" })
        .eq("user_email", userEmail)
        .eq("product", product);

      if (error) console.error("Transaction update error:", error);

      // If partner subscription, update status
      if (product.includes("Subscription")) {
        await supabase
          .from("partners")
          .update({ subscription_status: "active" })
          .eq("email", userEmail);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};

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
    // Verify webhook signature
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
      const amount = (session.amount_total || 0) / 100; // convert cents to dollars

      console.log(`✅ Payment received: ${userEmail}, Product: ${product}, Amount: $${amount}`);

      // 1. Increment entitlements (grant credits)
      const { data: entitlement, error: entError } = await supabase
        .from("entitlements")
        .select("credits")
        .eq("email", userEmail)
        .single();

      if (entError && entError.code !== "PGRST116") {
        // Not just "row not found"
        console.error("Entitlement fetch error:", entError);
      }

      const newCredits = (entitlement?.credits || 0) + 20;

      const { error: upsertError } = await supabase
        .from("entitlements")
        .upsert(
          { email: userEmail, credits: newCredits },
          { onConflict: "email" }
        );

      if (upsertError) {
        console.error("Entitlement update error:", upsertError);
      } else {
        console.log(`🎉 Updated credits for ${userEmail}: ${newCredits}`);
      }

      // 2. Update transactions table
      const { error: txnError } = await supabase
        .from("transactions")
        .update({ payout_status: "pending" })
        .eq("user_email", userEmail)
        .eq("product", product);

      if (txnError) console.error("Transaction update error:", txnError);

      // 3. If subscription, update partners table
      if (product.toLowerCase().includes("subscription")) {
        const { error: partnerError } = await supabase
          .from("partners")
          .update({ subscription_status: "active" })
          .eq("email", userEmail);

        if (partnerError) console.error("Partner update error:", partnerError);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};

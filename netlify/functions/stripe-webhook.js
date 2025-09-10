const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { createClient } = require("@supabase/supabase-js");
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
      const email = session.customer_details.email;

      await supabase
        .from("entitlements")
        .upsert({ email, credits: 20 }, { onConflict: "email" });
    }

    return { statusCode: 200, body: "Webhook received" };
  } catch (err) {
    console.error(err);
    return { statusCode: 400, body: "Webhook error" };
  }
};

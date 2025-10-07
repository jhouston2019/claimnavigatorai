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

        // Assign initial credits to the user
        try {
          // Get user ID from Supabase
          const { data: users } = await fetch(
            `${process.env.SUPABASE_URL}/auth/v1/users?email=eq.${email}`,
            {
              headers: {
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          ).then(r => r.json());

          const user_id = users?.[0]?.id;

          if (user_id) {
            await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_credits`, {
              method: 'POST',
              headers: {
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
              },
              body: JSON.stringify({ user_id, credits: 20 })
            });
            console.log("✅ 20 credits assigned to user:", email);
          } else {
            console.log("⚠️ User not found for credits assignment:", email);
          }
        } catch (creditError) {
          console.error("❌ Error assigning credits:", creditError);
        }
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
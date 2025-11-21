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
      const session = evt.data.object;
      const email = session.customer_details?.email;
      const sessionId = session.id;
      const amountPaid = session.amount_total; // in cents

      if (email) {
        console.log("✅ Stripe checkout complete for:", email);

        // Get or create user in Supabase
        let userId = null;
        try {
          // Check if user exists
          const userResp = await fetch(
            `${process.env.SUPABASE_URL}/auth/v1/users?email=eq.${encodeURIComponent(email)}`,
            {
              headers: {
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const users = await userResp.json();
          
          if (users && users.length > 0) {
            userId = users[0].id;
          } else {
            // Create user via Supabase Auth
            const createResp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
              method: "POST",
              headers: {
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                email,
                email_confirm: true,
                user_metadata: { source: 'stripe_checkout' }
              }),
            });
            const newUser = await createResp.json();
            userId = newUser.id;
            console.log("✅ Created new user:", userId);
          }
        } catch (userError) {
          console.error("❌ Error getting/creating user:", userError);
        }

        // Record payment in payments table
        if (userId) {
          try {
            await fetch(`${process.env.SUPABASE_URL}/rest/v1/payments`, {
              method: 'POST',
              headers: {
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
              },
              body: JSON.stringify({
                user_id: userId,
                stripe_checkout_session_id: sessionId,
                stripe_customer_id: session.customer,
                status: 'completed',
                plan: session.metadata?.product || 'claim_navigator_toolkit',
                amount_paid: amountPaid
              })
            });
            console.log("✅ Payment recorded for user:", userId);
          } catch (paymentError) {
            console.error("❌ Error recording payment:", paymentError);
          }
        }
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
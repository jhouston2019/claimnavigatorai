const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Expecting { userEmail, affiliateID }
    const { userEmail, affiliateID } = JSON.parse(event.body);

    if (!userEmail) {
      return { statusCode: 400, body: "Missing user email" };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
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
      metadata: {
        affiliateID: affiliateID || null,
        product: "ClaimNavigatorAI – 20 Document Credits",
      },
    });

    // Log transaction in Supabase (affiliate commission pending)
    const { error } = await supabase.from("transactions").insert([
      {
        user_email: userEmail,
        product: "ClaimNavigatorAI – 20 Document Credits",
        amount: 499, // in dollars (not cents)
        affiliateid: affiliateID || null,
        payout_status: "pending",
      },
    ]);

    if (error) {
      console.error("Supabase transaction log error:", error);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

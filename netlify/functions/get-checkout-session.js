const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { email, type } = JSON.parse(event.body);

    if (!email || !type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email or type" }),
      };
    }

    // Decide which price ID to use
    let priceId;
    if (type === "main") {
      priceId = process.env.STRIPE_MAIN_PRICE_ID; // $499 package = 20 credits
    } else if (type === "topup") {
      priceId = process.env.STRIPE_TOPUP_PRICE_ID; // $29 package = 1 credit
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid purchase type" }),
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email, // auto-fills Stripe checkout & receipts
      metadata: {
        email, // ✅ webhook will use this to match Supabase user
        type,  // ✅ tells webhook "main" or "topup"
      },
      success_url: `${process.env.URL}/app/receipt.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/product.html`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const signature = event.headers['stripe-signature'];
  
  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const email = session.customer_details?.email;

      if (email) {
        console.log("✅ Stripe checkout complete for:", email);

        // Send Netlify Identity invite
        const identityUrl = process.env.IDENTITY_API_URL || 'https://claimnavigatorai.com/.netlify/identity';
        
        const inviteResponse = await fetch(`${identityUrl}/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.IDENTITY_ADMIN_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: email, 
            invited: true,
            confirmed: true
          }),
        });

        if (inviteResponse.ok) {
          console.log("✅ Invite sent via Netlify Identity for:", email);
        } else {
          const errorText = await inviteResponse.text();
          console.error("❌ Failed to send invite:", errorText);
        }
      }
    }

    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return { 
      statusCode: 400, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }
};
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe + Supabase
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle successful checkout
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      // Get customer details
      const customer = await stripe.customers.retrieve(session.customer);
      const email = customer.email;

      if (!email) {
        throw new Error('No email found on Stripe customer.');
      }

      // Credits granted per purchase
      const creditsToAdd = 20; // 🔧 adjust for your pricing tier

      // Upsert into Supabase entitlements
      const { data, error } = await supabase
        .from('entitlements')
        .upsert(
          { email, credits: creditsToAdd },
          { onConflict: 'email' }
        )
        .select();

      if (error) throw error;

      console.log(`✅ Added ${creditsToAdd} credits for ${email}`, data);

      return { statusCode: 200, body: 'Credits granted successfully.' };
    } catch (err) {
      console.error('⚠️ Error updating entitlements:', err);
      return { statusCode: 500, body: 'Server error.' };
    }
  }

  return { statusCode: 200, body: 'Unhandled event type' };
};

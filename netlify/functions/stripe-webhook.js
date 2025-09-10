const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
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
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle checkout.session.completed
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    // Stripe sends the email in session.customer_details
    const email = session.customer_details?.email;

    if (!email) {
      console.error('No email found in checkout session');
      return { statusCode: 400, body: 'Missing email' };
    }

    // Add 20 credits (or whatever you want per purchase)
    const { data, error } = await supabase
      .from('entitlements')
      .upsert(
        { email, credits: 20 },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select();

    if (error) {
      console.error('Error updating entitlements:', error);
      return { statusCode: 500, body: 'Database update failed' };
    }

    console.log('Entitlements updated:', data);
  }

  return { statusCode: 200, body: 'Success' };
};

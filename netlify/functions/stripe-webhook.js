const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Important: Netlify automatically gives you the raw body for webhook verification
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

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;

      // You should store the user's email in metadata at checkout
      const email = session.customer_email || session.metadata?.email;
      if (!email) {
        console.error('No email found on checkout session');
        return { statusCode: 400, body: 'Missing email' };
      }

      // Decide how many credits to add (base vs top-up)
      let creditsToAdd = 20; // default for main package
      if (session.metadata?.type === 'topup') {
        creditsToAdd = 1; // $29 = 1 credit top-up
      }

      // Upsert entitlement
      const { data, error } = await supabase
        .from('entitlements')
        .upsert(
          { email, credits: creditsToAdd },
          { onConflict:

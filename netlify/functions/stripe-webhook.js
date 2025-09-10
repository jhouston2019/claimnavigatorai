const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

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

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    const email = session.customer_details?.email;
    const creditsPurchased = 20; // default package size
    const product = 'AI Claim Toolkit';
    const amount = session.amount_total / 100; // Stripe uses cents
    const currency = session.currency.toUpperCase();

    if (email) {
      try {
        // 1. Insert into orders table
        const { error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              email,
              session_id: session.id,
              product,
              amount,
              currency,
              credits_added: creditsPurchased
            }
          ]);

        if (orderError) {
          console.error('Supabase insert order error:', orderError);
        }

        // 2. Update entitlements table
        const { data, error } = await supabase
          .from('entitlements')
          .upsert(
            { email, credits: creditsPurchased },
            { onConflict: 'email' }
          )
          .select();

        if (error) {
          console.error('Supabase entitlement error:', error);
        } else {
          console.log('Entitlement updated:', data);
        }
      } catch (err) {
        console.error('Error handling checkout.session.completed:', err);
      }
    }
  }

  return { statusCode: 200, body: 'Webhook processed' };
};

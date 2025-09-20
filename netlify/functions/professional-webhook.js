const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  try {
    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripeEvent.data.object);
        break;
      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  const { metadata } = session;
  
  if (metadata.type === 'lead_purchase') {
    await processLeadPurchase(session, metadata);
  } else if (metadata.type === 'credits_purchase') {
    await processCreditsPurchase(session, metadata);
  }
}

async function processLeadPurchase(session, metadata) {
  const { lead_exchange_id, professional_id } = metadata;
  
  try {
    // Update the lead_exchange table to mark as claimed
    const { data, error } = await supabase
      .from('lead_exchange')
      .update({
        lead_status: 'claimed',
        claimed_by: professional_id
      })
      .eq('id', lead_exchange_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead exchange:', error);
      throw error;
    }

    console.log(`Lead exchange ${lead_exchange_id} successfully purchased by professional ${professional_id}`);
    
    // Log the transaction
    await supabase
      .from('professional_transactions')
      .insert([{
        professional_id: professional_id,
        lead_id: data.original_lead_id,
        type: 'lead_purchase',
        amount: data.price,
        stripe_session_id: session.id,
        status: 'completed'
      }]);

  } catch (error) {
    console.error('Failed to process lead purchase:', error);
    throw error;
  }
}

async function processCreditsPurchase(session, metadata) {
  const { professional_id, credits, amount } = metadata;
  
  try {
    // Add credits to the professional's account
    const { data, error } = await supabase.rpc('add_credits', {
      p_professional_id: professional_id,
      p_credits: parseFloat(credits)
    });

    if (error) {
      console.error('Error adding credits:', error);
      throw error;
    }

    console.log(`Added ${credits} credits to professional ${professional_id}`);
    
    // Log the transaction
    await supabase
      .from('professional_transactions')
      .insert([{
        professional_id: professional_id,
        type: 'credits_purchase',
        amount: parseFloat(amount),
        credits: parseFloat(credits),
        stripe_session_id: session.id,
        status: 'completed'
      }]);

  } catch (error) {
    console.error('Failed to process credits purchase:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  // Additional processing if needed
}

/**
 * Netlify Function: Stripe Webhook Handler
 * Phase 18 - Stripe Paywall
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  // Handle the event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const userId = session.metadata?.user_id;
    const sessionId = session.id;
    const customerEmail = session.customer_details?.email || session.customer_email;

    // For guest checkouts, we'll store the session and email
    // User will create account on success page and claim will be linked then
    if (!userId) {
      console.log('Guest checkout - no user_id yet. Email:', customerEmail);
      // Store payment info for later linking when user creates account
      // For now, just acknowledge the webhook
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          received: true, 
          message: 'Guest checkout - user will create account on success page',
          session_id: sessionId,
          email: customerEmail
        })
      };
    }

    try {
      // Import Supabase client
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Check if claim already exists for this session
      const { data: existingClaim } = await supabase
        .from('claims')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .single();

      if (existingClaim) {
        // Already processed
        return {
          statusCode: 200,
          body: JSON.stringify({ received: true, message: 'Already processed' })
        };
      }

      // Create new claim
      const { data: newClaim, error: claimError } = await supabase
        .from('claims')
        .insert({
          user_id: userId,
          stripe_session_id: sessionId,
          status: 'active',
          claim_data: {}
        })
        .select()
        .single();

      if (claimError) {
        console.error('Error creating claim:', claimError);
        throw claimError;
      }

      // Update user metadata
      const { error: updateError } = await supabase
        .from('users_metadata')
        .update({
          active_claim_id: newClaim.id,
          total_claims_created: supabase.raw('total_claims_created + 1')
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        // Don't fail the webhook if this fails
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, claim_id: newClaim.id })
      };

    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to process webhook' })
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};

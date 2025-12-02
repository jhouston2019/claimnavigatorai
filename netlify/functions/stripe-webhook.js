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

    if (!userId) {
      console.error('No user_id in session metadata');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user_id' })
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
        .eq('unlocked_via_stripe_session_id', sessionId)
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
          unlocked_via_stripe_session_id: sessionId,
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

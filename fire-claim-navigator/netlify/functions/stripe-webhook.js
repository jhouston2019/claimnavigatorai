const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  console.log('Received Stripe webhook event:', stripeEvent.type);

  try {
    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripeEvent.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(stripeEvent.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
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
  console.log('Processing checkout.session.completed for session:', session.id);
  
  try {
    // Extract data from session metadata
    const metadata = session.metadata;
    
    // Handle appeal purchases
    if (metadata && metadata.product_type === 'appeal') {
      await handleAppealPurchase(session);
      return;
    }
    
    // Handle claim license purchases
    if (!metadata || metadata.product_type !== 'claim_license') {
      console.log('Not a claim license or appeal checkout, skipping');
      return;
    }

    // Get user by email
    const userEmail = metadata.user_email || session.customer_email;
    if (!userEmail) {
      throw new Error('No user email found in session');
    }

    console.log('Looking up user by email:', userEmail);
    
    // Find user in Supabase auth
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error fetching users: ${userError.message}`);
    }

    const user = users.users.find(u => u.email === userEmail);
    if (!user) {
      throw new Error(`User not found for email: ${userEmail}`);
    }

    console.log('Found user:', user.id);

    // Parse loss location if it's a JSON string
    let lossLocation = metadata.loss_location;
    try {
      lossLocation = JSON.parse(lossLocation);
    } catch (e) {
      // If it's not JSON, keep it as a string
    }

    // Create claim record
    const claimData = {
      user_id: user.id,
      policy_number: metadata.policy_number,
      insured_name: metadata.insured_name,
      insurer: metadata.insurer,
      date_of_loss: metadata.date_of_loss,
      type_of_loss: metadata.type_of_loss,
      loss_location: typeof lossLocation === 'object' 
        ? `${lossLocation.address}, ${lossLocation.city}, ${lossLocation.state} ${lossLocation.zip}`
        : lossLocation,
      property_type: metadata.property_type,
      status: 'paid', // Mark as paid since payment succeeded
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      amount_paid: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      metadata: {
        checkout_metadata: metadata,
        payment_method: session.payment_method_types?.[0],
        customer_id: session.customer
      }
    };

    console.log('Creating claim with data:', JSON.stringify(claimData, null, 2));

    // Insert claim into database
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert([claimData])
      .select()
      .single();

    if (claimError) {
      throw new Error(`Error creating claim: ${claimError.message}`);
    }

    console.log('Claim created successfully:', claim.id);

    // Initialize timeline for the new claim
    try {
      const { error: timelineError } = await supabase.rpc('initialize_claim_timeline', {
        claim_uuid: claim.id
      });
      
      if (timelineError) {
        console.error('Error initializing timeline:', timelineError);
        // Don't fail the webhook for timeline initialization errors
      } else {
        console.log('Timeline initialized for claim:', claim.id);
      }
    } catch (timelineError) {
      console.error('Error calling timeline initialization function:', timelineError);
      // Don't fail the webhook for timeline initialization errors
    }

    // Log the successful claim creation
    const { error: logError } = await supabase
      .from('claim_access_logs')
      .insert([{
        user_id: user.id,
        claim_id: claim.id,
        action: 'created',
        document_type: 'claim_license',
        metadata: {
          stripe_session_id: session.id,
          payment_intent_id: session.payment_intent,
          amount_paid: claimData.amount_paid,
          currency: claimData.currency
        }
      }]);

    if (logError) {
      console.error('Error logging claim creation:', logError);
      // Don't fail the webhook for logging errors
    }

    // Update checkout session record if it exists
    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        claim_id: claim.id,
        completed_at: new Date().toISOString()
      })
      .eq('session_id', session.id);

    if (updateError) {
      console.error('Error updating checkout session:', updateError);
      // Don't fail the webhook for logging errors
    }

    console.log('Checkout session completed successfully for claim:', claim.id);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    
    // Log the error for debugging
    try {
      await supabase
        .from('webhook_errors')
        .insert([{
          event_type: 'checkout.session.completed',
          session_id: session.id,
          error_message: error.message,
          error_stack: error.stack,
          metadata: session.metadata,
          created_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
    
    throw error; // Re-throw to mark webhook as failed
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Processing payment_intent.succeeded for:', paymentIntent.id);
  
  try {
    // Update any related records if needed
    const { error } = await supabase
      .from('claims')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating claim status:', error);
    } else {
      console.log('Claim status updated to paid for payment intent:', paymentIntent.id);
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Processing payment_intent.payment_failed for:', paymentIntent.id);
  
  try {
    // Update claim status to failed
    const { error } = await supabase
      .from('claims')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating claim status to cancelled:', error);
    } else {
      console.log('Claim status updated to cancelled for payment intent:', paymentIntent.id);
    }

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleAppealPurchase(session) {
  console.log('Processing appeal purchase for session:', session.id);
  
  try {
    const userEmail = session.customer_email;
    if (!userEmail) {
      throw new Error('No user email found in session');
    }

    console.log('Processing appeal purchase for user:', userEmail);

    // Generate unique appeal ID
    const appealId = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new appeal object
    const newAppeal = {
      appeal_id: appealId,
      status: 'active',
      used: false,
      purchased_at: new Date().toISOString(),
      stripe_session_id: session.id,
      amount_paid: session.amount_total / 100
    };

    // Get or create user entitlements record
    const { data: existingEntitlement, error: fetchError } = await supabase
      .from('entitlements')
      .select('appeals')
      .eq('email', userEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error fetching user entitlements: ${fetchError.message}`);
    }

    // Initialize appeals array if it doesn't exist
    const currentAppeals = existingEntitlement?.appeals || [];
    const updatedAppeals = [...currentAppeals, newAppeal];

    // Upsert the entitlements record
    const { error: upsertError } = await supabase
      .from('entitlements')
      .upsert({
        email: userEmail,
        appeals: updatedAppeals,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      throw new Error(`Error updating user appeals: ${upsertError.message}`);
    }

    // Log the transaction
    const { error: logError } = await supabase
      .from('transactions')
      .insert([{
        user_email: userEmail,
        product: 'Appeal Builder - Premium Access',
        amount: session.amount_total / 100,
        affiliateid: null,
        payout_status: 'completed',
        stripe_session_id: session.id,
        created_at: new Date().toISOString()
      }]);

    if (logError) {
      console.error('Error logging appeal transaction:', logError);
      // Don't fail the webhook for logging errors
    }

    console.log(`Appeal purchase completed successfully for user: ${userEmail}, appeal ID: ${appealId}`);

  } catch (error) {
    console.error('Error handling appeal purchase:', error);
    
    // Log the error for debugging
    try {
      await supabase
        .from('webhook_errors')
        .insert([{
          event_type: 'checkout.session.completed',
          session_id: session.id,
          error_message: error.message,
          error_stack: error.stack,
          metadata: session.metadata,
          created_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
    
    throw error; // Re-throw to mark webhook as failed
  }
}
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

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // Parse request body
    const { amount, credits, professional_id } = JSON.parse(event.body);

    if (!amount || !credits || !professional_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: amount, credits, professional_id' })
      };
    }

    // Verify the professional exists
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', professional_id)
      .single();

    if (profError || !professional) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Professional not found' })
      };
    }

    // Determine the site URL dynamically
    const siteUrl = process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com';
    
    // Create Stripe checkout session for credits purchase
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Professional Credits',
            description: `${credits} credits for lead purchases ($${amount} value)`,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/app/professional-dashboard.html?session_id={CHECKOUT_SESSION_ID}&credits=success`,
      cancel_url: `${siteUrl}/app/professional-dashboard.html?credits=cancelled`,
      metadata: {
        type: 'credits_purchase',
        professional_id: professional_id,
        credits: credits,
        amount: amount
      },
      // Collect customer email
      customer_email: professional.email || undefined,
      // Billing address collection
      billing_address_collection: 'required',
      // Phone number collection
      phone_number_collection: {
        enabled: true
      },
      // Custom fields for legal compliance
      custom_fields: [
        {
          key: 'terms_acceptance',
          label: {
            type: 'custom',
            custom: 'Terms & Conditions'
          },
          type: 'dropdown',
          dropdown: {
            options: [
              {
                label: 'I agree to the Terms of Service and Privacy Policy',
                value: 'accepted'
              }
            ]
          },
          optional: false
        }
      ],
      // Consent collection
      consent_collection: {
        terms_of_service: {
          required: true
        }
      }
    });

    // Log session creation
    console.log(`Credits checkout session created: ${session.id} for professional ${professional_id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      })
    };

  } catch (error) {
    console.error('Stripe error:', error);
    
    let errorMessage = 'Failed to create checkout session';
    let errorCode = 'CHECKOUT_ERROR';
    
    if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Payment configuration error. Please contact support.';
      errorCode = 'AUTH_ERROR';
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid request. Please try again.';
      errorCode = 'INVALID_REQUEST';
    } else if (error.type === 'StripeAPIError') {
      errorMessage = 'Payment service temporarily unavailable. Please try again.';
      errorCode = 'API_ERROR';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        code: errorCode,
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

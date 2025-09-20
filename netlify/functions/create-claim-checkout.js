const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { 
      claimData,
      userEmail,
      affiliateID 
    } = body;

    // Validate required fields
    if (!claimData || !userEmail) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields: claimData and userEmail are required' 
        })
      };
    }

    // Validate claim data structure
    const requiredClaimFields = [
      'policy_number', 'insured_name', 'insurer', 'date_of_loss', 
      'type_of_loss', 'loss_location', 'property_type'
    ];

    for (const field of requiredClaimFields) {
      if (!claimData[field]) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: `Missing required claim field: ${field}` 
          })
        };
      }
    }

    console.log(`Creating claim checkout session for user: ${userEmail}`);
    console.log('Claim data:', JSON.stringify(claimData, null, 2));

    // Determine site URL
    const siteUrl = process.env.URL || 'https://claimnavigatorai.netlify.app';

    // Create Stripe Checkout Session with claim metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "ClaimNavigatorAI - Per-Claim License",
              description: `AI-powered claim documentation for ${claimData.insured_name} - Policy #${claimData.policy_number}`
            },
            unit_amount: 99700, // $997.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/app/claim/{CLAIM_ID}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app/claims/new.html?canceled=true`,
      metadata: {
        // Claim information
        policy_number: claimData.policy_number,
        insured_name: claimData.insured_name,
        insurer: claimData.insurer,
        date_of_loss: claimData.date_of_loss,
        type_of_loss: claimData.type_of_loss,
        loss_location: typeof claimData.loss_location === 'string' 
          ? claimData.loss_location 
          : JSON.stringify(claimData.loss_location),
        property_type: claimData.property_type,
        status: claimData.status || 'new',
        
        // System information
        product: "ClaimNavigatorAI - Per-Claim License",
        product_type: "claim_license",
        version: "2.0",
        affiliateID: affiliateID || null,
        
        // User information
        user_email: userEmail,
        
        // Additional metadata
        created_at: new Date().toISOString(),
        source: 'claim_checkout'
      },
      
      // Enhanced security settings
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true
      },
      
      // Legal compliance
      consent_collection: {
        terms_of_service: 'required'
      },
      
      // Customer creation for future reference
      customer_creation: 'always',
      
      // Invoice settings
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `ClaimNavigatorAI License - ${claimData.insured_name} (Policy #${claimData.policy_number})`,
          footer: 'Per-claim license - no refunds. Not legal or insurance advice.'
        }
      },
      
      // Custom fields for additional claim information
      custom_fields: [
        {
          key: 'policy_number',
          label: {
            type: 'custom',
            custom: 'Policy Number'
          },
          type: 'text',
          optional: false
        },
        {
          key: 'insured_name',
          label: {
            type: 'custom',
            custom: 'Insured Name'
          },
          type: 'text',
          optional: false
        }
      ]
    });

    if (!session || !session.url) {
      console.error("Invalid Stripe session response");
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Failed to create checkout session" })
      };
    }

    console.log(`Stripe claim checkout session created: ${session.id}`);

    // Log the checkout session creation
    try {
      const { error: logError } = await supabase
        .from('checkout_sessions')
        .insert([{
          session_id: session.id,
          user_email: userEmail,
          product_type: 'claim_license',
          amount: 99700,
          currency: 'usd',
          status: 'created',
          metadata: {
            claim_data: claimData,
            affiliate_id: affiliateID
          },
          created_at: new Date().toISOString()
        }]);

      if (logError) {
        console.error('Error logging checkout session:', logError);
        // Don't fail the request for logging errors
      }
    } catch (logError) {
      console.error('Error logging checkout session:', logError);
      // Don't fail the request for logging errors
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
        message: 'Checkout session created successfully'
      })
    };

  } catch (error) {
    console.error('Error creating claim checkout session:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

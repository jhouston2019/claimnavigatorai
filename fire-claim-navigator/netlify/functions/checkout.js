const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Check if Stripe key is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Payment system not configured. Please contact support.',
        code: 'CONFIG_ERROR'
      })
    };
  }

  try {
    // Parse request body if present
    let email = undefined;
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        email = body.email;
      } catch (e) {
        // Ignore parse errors, email is optional
      }
    }

    // Determine the site URL dynamically
    const siteUrl = process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com';
    
    // Create Stripe checkout session with legal protections
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'ClaimNavigatorAI Toolkit',
            description: 'AI-powered claim documentation package (20 AI responses included). Digital product - delivered immediately upon payment.',
          },
          unit_amount: 99700, // $997.00 in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: siteUrl,
      metadata: {
        product: 'claim_toolkit',
        ai_responses: '20',
        terms_version: '1.0',
        privacy_version: '1.0'
      },
      // Collect customer email if provided
      customer_email: email,
      // Billing address collection
      billing_address_collection: 'required',
      // Allow promotion codes
      allow_promotion_codes: true,
      // Phone number collection (useful for support)
      phone_number_collection: {
        enabled: true
      },
      // LEGAL PROTECTIONS - Custom fields
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
                label: 'I agree to the Terms of Service, Privacy Policy & Disclaimer',
                value: 'accepted'
              }
            ]
          },
          optional: false // REQUIRED field
        },
        {
          key: 'age_verification',
          label: {
            type: 'custom',
            custom: 'Age Verification'
          },
          type: 'dropdown',
          dropdown: {
            options: [
              {
                label: 'I confirm that I am 18 years or older',
                value: 'confirmed'
              }
            ]
          },
          optional: false // REQUIRED field
        },
        {
          key: 'refund_acknowledgment',
          label: {
            type: 'custom',
            custom: 'Digital Product Notice'
          },
          type: 'dropdown',
          dropdown: {
            options: [
              {
                label: 'I understand this is a digital product with no refunds',
                value: 'acknowledged'
              }
            ]
          },
          optional: false // REQUIRED field
        }
      ],
      // Legal compliance handled through custom text
      // Custom text for legal clarity
      custom_text: {
        submit: {
          message: 'By completing this purchase, you agree to our Terms of Service and acknowledge that this is a non-refundable digital product.'
        },
        terms_of_service_acceptance: {
          message: 'I agree to the [Terms of Service](${siteUrl}/terms.html), [Privacy Policy](${siteUrl}/privacy.html), and [Legal Disclaimer](${siteUrl}/disclaimer.html)'
        }
      },
      // Automatic tax collection (if configured in Stripe)
      automatic_tax: { 
        enabled: false 
      },
      // Customer creation for future purchases
      customer_creation: 'always',
      // Invoice creation for business customers
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: 'ClaimNavigatorAI Toolkit - AI-powered claim documentation package',
          footer: 'Digital product - no refunds. Not legal or insurance advice.',
          custom_fields: [
            {
              name: 'Terms',
              value: 'Subject to Terms of Service at claimnavigatorai.netlify.app/terms.html'
            }
          ]
        }
      }
    });

    // Log session creation for debugging and compliance
    console.log(`Checkout session created: ${session.id} with legal protections`);

    // Track checkout initiation for analytics
    const analyticsData = {
      event: 'checkout_started',
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      email: email || 'not_provided'
    };
    
    // Store analytics event (for conversion tracking)
    const { getStore } = require("@netlify/blobs");
    const analyticsStore = getStore("analytics");
    await analyticsStore.setJSON(`checkout_${session.id}`, analyticsData);

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
    Sentry.captureException(error);
    
    // Handle specific Stripe errors
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
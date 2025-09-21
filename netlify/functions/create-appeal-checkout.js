const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

// Initialize Stripe with error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.error("Stripe initialization error:", error.message);
}

// Initialize Supabase with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Supabase initialization error:", error.message);
}

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Payment service configuration error" })
      };
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database configuration error" })
      };
    }

    // Validate HTTP method
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request format" })
      };
    }

    const { userEmail } = requestData;

    // Validate required fields
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Valid user email is required" })
      };
    }

    console.log(`Creating appeal checkout session for user: ${userEmail}`);

    // Determine site URL
    const siteUrl = process.env.URL || 'https://claimnavigatorai.com';

    // Create Stripe Checkout Session for appeal
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Appeal Builder - Premium Access",
              description: "Generate a complete, customized appeal letter + evidence package"
            },
            unit_amount: 24900, // $249.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/app/response-center.html?appeal_purchased=true`,
      cancel_url: `${siteUrl}/app/response-center.html?appeal_canceled=true`,
      metadata: {
        product: "Appeal Builder - Premium Access",
        product_type: "appeal",
        version: "1.0"
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
          description: 'Appeal Builder - Premium Access - AI-powered appeal letter generation',
          footer: 'Digital product - no refunds. Not legal or insurance advice.'
        }
      }
    });

    if (!session || !session.url) {
      console.error("Invalid Stripe session response");
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Failed to create checkout session" })
      };
    }

    console.log(`Stripe appeal checkout session created: ${session.id}`);

    // Log transaction in Supabase with proper error handling
    const { error: dbError } = await supabase.from("transactions").insert([
      {
        user_email: userEmail,
        product: "Appeal Builder - Premium Access",
        amount: 249, // in dollars (not cents)
        affiliateid: null,
        payout_status: "pending",
        stripe_session_id: session.id,
        created_at: new Date().toISOString()
      },
    ]);

    if (dbError) {
      console.error("Supabase transaction log error:", dbError.message);
      // Don't fail the request, but log the error for monitoring
    } else {
      console.log(`Appeal transaction logged in database for session: ${session.id}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Appeal checkout session created successfully in ${processingTime}ms`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: session.url,
        session_id: session.id,
        processing_time_ms: processingTime
      })
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Stripe appeal checkout error:", {
      message: err.message,
      stack: err.stack,
      processingTime: `${processingTime}ms`
    });
    
    // Handle specific Stripe errors
    let errorMessage = "Payment service error";
    let statusCode = 500;
    
    if (err.type === 'StripeAuthenticationError') {
      errorMessage = "Payment configuration error";
      statusCode = 500;
    } else if (err.type === 'StripeInvalidRequestError') {
      errorMessage = "Invalid payment request";
      statusCode = 400;
    } else if (err.type === 'StripeAPIError') {
      errorMessage = "Payment service temporarily unavailable";
      statusCode = 503;
    }
    
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: err.message,
          stack: err.stack 
        })
      })
    };
  }
};

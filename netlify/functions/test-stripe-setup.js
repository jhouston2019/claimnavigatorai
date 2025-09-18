const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    // Test Stripe configuration
    const stripeConfig = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretKeyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.length : 0
    };

    // Test Supabase configuration
    const supabaseConfig = {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      urlLength: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0,
      anonKeyLength: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0
    };

    // Test Stripe connection
    let stripeTest = { connected: false, error: null };
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        // Test with a simple API call
        await stripe.products.list({ limit: 1 });
        stripeTest.connected = true;
      } catch (error) {
        stripeTest.error = error.message;
      }
    }

    // Test Supabase connection
    let supabaseTest = { connected: false, error: null };
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        // Test with a simple query
        const { data, error } = await supabase.from("entitlements").select("count").limit(1);
        if (!error) {
          supabaseTest.connected = true;
        } else {
          supabaseTest.error = error.message;
        }
      } catch (error) {
        supabaseTest.error = error.message;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stripe: {
          config: stripeConfig,
          connection: stripeTest
        },
        supabase: {
          config: supabaseConfig,
          connection: supabaseTest
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          netlifyUrl: process.env.URL,
          netlifySite: process.env.SITE_ID
        }
      })
    };

  } catch (error) {
    console.error("Test setup error:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

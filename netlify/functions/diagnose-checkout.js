exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Check environment variables
    const envStatus = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 
        (process.env.STRIPE_SECRET_KEY.startsWith('sk_') ? 'CONFIGURED' : 'INVALID_FORMAT') : 
        'NOT_SET',
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY ? 
        (process.env.STRIPE_PUBLIC_KEY.startsWith('pk_') ? 'CONFIGURED' : 'INVALID_FORMAT') : 
        'NOT_SET',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'CONFIGURED' : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURED' : 'NOT_SET'
    };

    // Test Stripe connection if key is configured
    let stripeTest = 'NOT_TESTED';
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // Test with a simple API call
        await stripe.prices.list({ limit: 1 });
        stripeTest = 'SUCCESS';
      } catch (error) {
        stripeTest = `ERROR: ${error.message}`;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        environment: envStatus,
        stripeTest,
        timestamp: new Date().toISOString(),
        recommendations: {
          missingVars: Object.entries(envStatus)
            .filter(([key, value]) => value === 'NOT_SET')
            .map(([key]) => key),
          invalidVars: Object.entries(envStatus)
            .filter(([key, value]) => value === 'INVALID_FORMAT')
            .map(([key]) => key)
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Diagnostic failed',
        message: error.message
      })
    };
  }
};

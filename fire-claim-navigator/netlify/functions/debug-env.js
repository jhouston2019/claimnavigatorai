exports.handler = async (event, context) => {
  try {
    // Check all possible environment variables
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      CONTEXT: process.env.CONTEXT
    };

    // Check if we have at least URL and one key
    const hasUrl = !!envVars.SUPABASE_URL;
    const hasAnonKey = !!envVars.SUPABASE_ANON_KEY;
    const hasServiceKey = !!envVars.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnyKey = hasAnonKey || hasServiceKey;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: hasUrl && hasAnyKey,
        message: hasUrl && hasAnyKey ? 
          'Environment variables are ready!' : 
          'Missing required environment variables',
        environment: {
          SUPABASE_URL: hasUrl ? '✅ Set' : '❌ Missing',
          SUPABASE_ANON_KEY: hasAnonKey ? '✅ Set' : '❌ Missing',
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? '✅ Set' : '❌ Missing'
        },
        details: {
          hasUrl,
          hasAnonKey,
          hasServiceKey,
          hasAnyKey,
          canProceed: hasUrl && hasAnyKey
        },
        rawValues: {
          SUPABASE_URL: envVars.SUPABASE_URL ? 'Set (hidden)' : 'Not set',
          SUPABASE_ANON_KEY: envVars.SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
          SUPABASE_SERVICE_ROLE_KEY: envVars.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Not set'
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Error checking environment variables',
        details: error.message
      })
    };
  }
};

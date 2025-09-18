exports.handler = async (event, context) => {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envStatus = {
      SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
      SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '✅ Set' : '❌ Missing'
    };

    const allSet = supabaseUrl && supabaseAnonKey && supabaseServiceKey;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: allSet,
        message: allSet ? 'All environment variables are set!' : 'Some environment variables are missing',
        environment: envStatus,
        instructions: allSet ? 
          'Environment variables are ready. You can now run the populate function.' :
          'Please add the missing environment variables to your Netlify site settings.'
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

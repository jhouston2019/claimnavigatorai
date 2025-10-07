const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    // Get the authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized - Please login first' })
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify the JWT token with Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid authentication token' })
      };
    }

    console.log('✅ Authenticated user:', user.email);

    // For now, return default credits for paid users
    // In a full implementation, you would:
    // 1. Look up user credits in your database based on user.email
    // 2. Check if user has valid payment record
    // 3. Return the actual credit count

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        credits: 20, // Default credits for paid users
        user: user.email,
        message: 'Credits loaded successfully' 
      })
    };

  } catch (error) {
    console.error('Get user credits error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to load credits',
        details: error.message 
      })
    };
  }
};
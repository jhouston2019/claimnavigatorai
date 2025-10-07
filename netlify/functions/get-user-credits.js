const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    // Check if user is authenticated via Netlify Identity
    const user = context.clientContext && context.clientContext.user;
    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized - Please login first' })
      };
    }

    console.log('✅ Authenticated user:', user.email);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
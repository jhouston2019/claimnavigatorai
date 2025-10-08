const { supabase, getUserFromAuth } = require('./utils/auth');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get user from auth header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    // Get user credits from entitlements table
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', user.email)
      .single();

    if (entitlementError) {
      console.error('Error fetching credits:', entitlementError);
      // Return default credits for paid users
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ credits: 20 })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        credits: entitlement?.credits || 20,
        email: user.email 
      })
    };

  } catch (error) {
    console.error('Error in get-user-credits:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
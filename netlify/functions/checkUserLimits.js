const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { toolType, language } = JSON.parse(event.body);

    if (!toolType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'toolType is required' })
      };
    }

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

    console.log(`Limit check request from user: ${user.email}, toolType: ${toolType}, language: ${language}`);

    // Check user subscription status
    const subscriptionStatus = await getUserSubscriptionStatus(user);
    
    // Check limits based on tool type
    let limitCheck;
    if (toolType === 'document') {
      limitCheck = await checkDocumentLimit(user);
    } else if (toolType === 'advisory') {
      limitCheck = await checkAdvisoryLimit(user);
    } else {
      // Default to document limits
      limitCheck = await checkDocumentLimit(user);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        canGenerate: limitCheck.canGenerate,
        count: limitCheck.count,
        limit: limitCheck.limit,
        subscriptionStatus,
        upgradeRequired: subscriptionStatus === 'none' && !limitCheck.canGenerate
      })
    };

  } catch (error) {
    console.error('Error checking user limits:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        canGenerate: false,
        upgradeRequired: true
      })
    };
  }
};

/**
 * Get user subscription status
 */
async function getUserSubscriptionStatus(user) {
  try {
    // Check if user has active subscription in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log('Error fetching profile:', error);
      return 'none';
    }

    return profile?.subscription_status === 'active' ? 'active' : 'none';
  } catch (error) {
    console.log('Error checking subscription status:', error);
    return 'none';
  }
}

/**
 * Check document generation limits
 */
async function checkDocumentLimit(user) {
  try {
    // Get current month start date (UTC)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count documents generated this month
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    if (error) {
      console.error('Error counting documents:', error);
      throw new Error('Failed to check document limit');
    }

    const documentCount = count || 0;
    
    // Check subscription status
    const subscriptionStatus = await getUserSubscriptionStatus(user);
    
    // Free users: 2 documents per month
    // Subscribers: unlimited
    const limit = subscriptionStatus === 'active' ? Infinity : 2;
    const canGenerate = documentCount < limit;

    return {
      canGenerate,
      count: documentCount,
      limit: limit === Infinity ? 'unlimited' : limit,
      subscriptionStatus
    };
  } catch (error) {
    console.error('Error checking document limit:', error);
    throw error;
  }
}

/**
 * Check advisory generation limits
 */
async function checkAdvisoryLimit(user) {
  try {
    // Get current month start date (UTC)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count advisories generated this month
    const { count, error } = await supabase
      .from('advisories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    if (error) {
      console.error('Error counting advisories:', error);
      throw new Error('Failed to check advisory limit');
    }

    const advisoryCount = count || 0;
    
    // Check subscription status
    const subscriptionStatus = await getUserSubscriptionStatus(user);
    
    // Free users: 2 advisories per month
    // Subscribers: unlimited
    const limit = subscriptionStatus === 'active' ? Infinity : 2;
    const canGenerate = advisoryCount < limit;

    return {
      canGenerate,
      count: advisoryCount,
      limit: limit === Infinity ? 'unlimited' : limit,
      subscriptionStatus
    };
  } catch (error) {
    console.error('Error checking advisory limit:', error);
    throw error;
  }
}

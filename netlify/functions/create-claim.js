const { createClient } = require('@supabase/supabase-js');
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    // Set the auth token
    const token = authHeader.replace('Bearer ', '');
    supabase.auth.setAuth(token);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    // Parse request body
    const claimData = JSON.parse(event.body);

    // Validate required fields
    const requiredFields = ['date_of_loss', 'type_of_loss', 'loss_location', 'insured_name'];
    for (const field of requiredFields) {
      if (!claimData[field]) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        };
      }
    }

    // Validate loss_location structure
    if (typeof claimData.loss_location !== 'object' || 
        !claimData.loss_location.address || 
        !claimData.loss_location.city || 
        !claimData.loss_location.state || 
        !claimData.loss_location.zip) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid loss_location format. Must include address, city, state, and zip' })
      };
    }

    // Prepare claim data
    const newClaim = {
      user_id: user.id,
      date_of_loss: claimData.date_of_loss,
      type_of_loss: claimData.type_of_loss,
      loss_location: claimData.loss_location,
      insured_name: claimData.insured_name,
      policy_number: claimData.policy_number || null,
      insurer: claimData.insurer || null,
      status: claimData.status || 'new',
      property_type: claimData.property_type || null
    };

    // Insert the claim
    const { data: claim, error } = await supabase
      .from('claims')
      .insert([newClaim])
      .select()
      .single();

    if (error) {
      console.error('Error creating claim:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to create claim' })
      };
    }

    // SB-1: Log claim creation to timeline
    try {
      await supabase
        .from('claim_timeline')
        .insert({
          user_id: userId,
          claim_id: claim.id,
          event_type: 'claim_created',
          event_date: new Date().toISOString().split('T')[0],
          source: 'system',
          title: 'Claim Created',
          description: `Claim created for ${claim.insured_name} - ${claim.type_of_loss}`,
          metadata: {
            actor: 'system',
            claim_status: claim.status,
            policy_number: claim.policy_number,
            insurer: claim.insurer,
            date_of_loss: claim.date_of_loss
          }
        });
    } catch (timelineError) {
      console.warn('Failed to log claim creation to timeline:', timelineError);
      // Don't fail the request if timeline logging fails
    }

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ claim })
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    Sentry.captureException(error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

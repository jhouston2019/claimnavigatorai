const { createClient } = require('@supabase/supabase-js');

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

  if (event.httpMethod !== 'PUT') {
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
    const { claimId, ...claimData } = JSON.parse(event.body);

    if (!claimId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Claim ID is required' })
      };
    }

    // Validate loss_location structure if provided
    if (claimData.loss_location && 
        (typeof claimData.loss_location !== 'object' || 
         !claimData.loss_location.address || 
         !claimData.loss_location.city || 
         !claimData.loss_location.state || 
         !claimData.loss_location.zip)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid loss_location format. Must include address, city, state, and zip' })
      };
    }

    // SB-2: Get current claim to detect status changes
    const { data: currentClaim } = await supabase
      .from('claims')
      .select('status')
      .eq('id', claimId)
      .eq('user_id', user.id)
      .single();

    // Add updated_at timestamp
    const updateData = {
      ...claimData,
      updated_at: new Date().toISOString()
    };

    // Update the claim
    const { data: claim, error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', claimId)
      .eq('user_id', user.id) // Ensure user can only update their own claims
      .select()
      .single();

    if (error) {
      console.error('Error updating claim:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to update claim' })
      };
    }

    if (!claim) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Claim not found or access denied' })
      };
    }

    // SB-2: Log status change if status was updated
    if (currentClaim && claimData.status && currentClaim.status !== claimData.status) {
      try {
        const statusEventTypes = {
          'new': 'claim_created',
          'active': 'claim_reopened',
          'completed': 'claim_closed',
          'cancelled': 'claim_closed',
          'paid': 'claim_closed'
        };
        
        const eventType = statusEventTypes[claimData.status] || 'claim_status_changed';
        
        await supabase
          .from('claim_timeline')
          .insert({
            user_id: user.id,
            claim_id: claimId,
            event_type: eventType,
            event_date: new Date().toISOString().split('T')[0],
            source: 'system',
            title: `Claim Status Changed: ${currentClaim.status} → ${claimData.status}`,
            description: `Claim status updated from ${currentClaim.status} to ${claimData.status}`,
            metadata: {
              actor: 'system',
              old_status: currentClaim.status,
              new_status: claimData.status
            }
          });
      } catch (timelineError) {
        console.warn('Failed to log status change to timeline:', timelineError);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ claim })
    };

  } catch (error) {
    console.error('Unexpected error:', error);
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

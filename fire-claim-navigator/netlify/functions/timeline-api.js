const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get user from JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const { claim_id } = event.queryStringParameters || {};
    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id is required' })
      };
    }

    // Verify user owns the claim
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id')
      .eq('id', claim_id)
      .eq('user_id', user.id)
      .single();

    if (claimError || !claim) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(event, claim_id);
      case 'POST':
        return await handlePost(event, claim_id);
      case 'PUT':
        return await handlePut(event, claim_id);
      case 'DELETE':
        return await handleDelete(event, claim_id);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Timeline API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleGet(event, claimId) {
  const { type } = event.queryStringParameters || {};
  
  try {
    let data = {};
    
    switch (type) {
      case 'phases':
        const { data: phases, error: phasesError } = await supabase
          .from('claim_timeline_phases')
          .select('*')
          .eq('claim_id', claimId)
          .order('phase_number');
        
        if (phasesError) throw phasesError;
        data = { phases };
        break;
        
      case 'milestones':
        const { data: milestones, error: milestonesError } = await supabase
          .from('claim_timeline_milestones')
          .select('*')
          .eq('claim_id', claimId)
          .order('due_day');
        
        if (milestonesError) throw milestonesError;
        data = { milestones };
        break;
        
      case 'deadlines':
        const { data: deadlines, error: deadlinesError } = await supabase
          .from('claim_timeline_deadlines')
          .select('*')
          .eq('claim_id', claimId)
          .order('due_day');
        
        if (deadlinesError) throw deadlinesError;
        data = { deadlines };
        break;
        
      case 'actions':
        const { data: actions, error: actionsError } = await supabase
          .from('claim_timeline_actions')
          .select('*')
          .eq('claim_id', claimId)
          .order('created_at', { ascending: false });
        
        if (actionsError) throw actionsError;
        data = { actions };
        break;
        
      case 'full':
      default:
        // Get all timeline data
        const [phasesResult, milestonesResult, deadlinesResult, actionsResult] = await Promise.all([
          supabase.from('claim_timeline_phases').select('*').eq('claim_id', claimId).order('phase_number'),
          supabase.from('claim_timeline_milestones').select('*').eq('claim_id', claimId).order('due_day'),
          supabase.from('claim_timeline_deadlines').select('*').eq('claim_id', claimId).order('due_day'),
          supabase.from('claim_timeline_actions').select('*').eq('claim_id', claimId).order('created_at', { ascending: false })
        ]);
        
        if (phasesResult.error) throw phasesResult.error;
        if (milestonesResult.error) throw milestonesResult.error;
        if (deadlinesResult.error) throw deadlinesResult.error;
        if (actionsResult.error) throw actionsResult.error;
        
        data = {
          phases: phasesResult.data,
          milestones: milestonesResult.data,
          deadlines: deadlinesResult.data,
          actions: actionsResult.data
        };
        break;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to fetch timeline data' })
    };
  }
}

async function handlePost(event, claimId) {
  try {
    const body = JSON.parse(event.body);
    const { type, data: itemData } = body;
    
    let result;
    
    switch (type) {
      case 'milestone':
        result = await supabase
          .from('claim_timeline_milestones')
          .insert([{
            claim_id: claimId,
            ...itemData
          }])
          .select()
          .single();
        break;
        
      case 'action':
        result = await supabase
          .from('claim_timeline_actions')
          .insert([{
            claim_id: claimId,
            ...itemData
          }])
          .select()
          .single();
        break;
        
      case 'initialize':
        // Initialize timeline for a claim
        const { error: initError } = await supabase.rpc('initialize_claim_timeline', {
          claim_uuid: claimId
        });
        
        if (initError) throw initError;
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ success: true, message: 'Timeline initialized' })
        };
        
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid type' })
        };
    }
    
    if (result.error) throw result.error;
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result.data)
    };

  } catch (error) {
    console.error('Error creating timeline item:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to create timeline item' })
    };
  }
}

async function handlePut(event, claimId) {
  try {
    const body = JSON.parse(event.body);
    const { type, id, data: updateData } = body;
    
    let result;
    
    switch (type) {
      case 'milestone':
        result = await supabase
          .from('claim_timeline_milestones')
          .update(updateData)
          .eq('id', id)
          .eq('claim_id', claimId)
          .select()
          .single();
        break;
        
      case 'action':
        result = await supabase
          .from('claim_timeline_actions')
          .update(updateData)
          .eq('id', id)
          .eq('claim_id', claimId)
          .select()
          .single();
        break;
        
      case 'phase':
        result = await supabase
          .from('claim_timeline_phases')
          .update(updateData)
          .eq('id', id)
          .eq('claim_id', claimId)
          .select()
          .single();
        break;
        
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid type' })
        };
    }
    
    if (result.error) throw result.error;
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result.data)
    };

  } catch (error) {
    console.error('Error updating timeline item:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to update timeline item' })
    };
  }
}

async function handleDelete(event, claimId) {
  try {
    const body = JSON.parse(event.body);
    const { type, id } = body;
    
    let result;
    
    switch (type) {
      case 'milestone':
        result = await supabase
          .from('claim_timeline_milestones')
          .delete()
          .eq('id', id)
          .eq('claim_id', claimId);
        break;
        
      case 'action':
        result = await supabase
          .from('claim_timeline_actions')
          .delete()
          .eq('id', id)
          .eq('claim_id', claimId);
        break;
        
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid type' })
        };
    }
    
    if (result.error) throw result.error;
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Error deleting timeline item:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to delete timeline item' })
    };
  }
}

/**
 * API Endpoint: /expert/find
 * Finds expert witnesses
 */

const { getSupabaseClient, sendSuccess, sendError } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Build query
    let query = supabase
      .from('expert_witnesses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(body?.limit || '50'));

    // Apply filters
    if (body.specialty) {
      query = query.eq('specialty', body.specialty);
    }
    if (body.state) {
      query = query.eq('state', body.state);
    }
    if (body.min_experience) {
      query = query.gte('experience_years', body.min_experience);
    }
    if (body.name_search) {
      query = query.ilike('name', `%${body.name_search}%`);
    }

    const { data: experts, error } = await query;

    if (error) {
      return sendError('Failed to find expert witnesses', 'CN-5001', 500, { databaseError: error.message });
    }

    return sendSuccess({
      experts: experts || [],
      count: experts?.length || 0,
      filters: {
        specialty: body.specialty || null,
        state: body.state || null,
        min_experience: body.min_experience || null
      }
    });

  } catch (error) {
    console.error('Expert Find API Error:', error);
    
    try {
      return sendError('Failed to find expert witnesses', 'CN-5000', 500, { errorType: error.name });
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            code: 'CN-9000',
            message: 'Critical system failure'
          }
        })
      };
    }
  }
};


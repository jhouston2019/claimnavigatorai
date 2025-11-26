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
      return sendError('Database not configured', 'CONFIG_ERROR', 500);
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
      return sendError('Failed to find expert witnesses', 'DATABASE_ERROR', 500);
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
    return sendError('Failed to find expert witnesses', 'INTERNAL_ERROR', 500);
  }
};


/**
 * Get system events stream
 */

const { getSupabaseClient, sendSuccess, sendError } = require('../lib/api-utils');

async function checkAdmin(supabase, userId) {
  const { data } = await supabase
    .from('ai_admins')
    .select('role')
    .eq('user_id', userId)
    .single();
  return !!data;
}

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError('Unauthorized', 'CN-2000', 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || !(await checkAdmin(supabase, user.id))) {
      return sendError('Admin access required', 'CN-2001', 403);
    }

    const params = event.queryStringParameters || {};
    const eventType = params.event_type;
    const source = params.source;
    const since = params.since || new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Default: last hour
    const limit = parseInt(params.limit || '100');

    let query = supabase
      .from('system_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (source) {
      query = query.eq('source', source);
    }

    const { data: events, error } = await query;

    if (error) {
      return sendError('Failed to fetch events', 'CN-5000', 500);
    }

    return sendSuccess({
      events: events || [],
      count: events?.length || 0,
      since: since
    });
  } catch (error) {
    console.error('Events stream error:', error);
    return sendError('Failed to fetch events', 'CN-5000', 500);
  }
};


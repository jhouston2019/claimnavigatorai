/**
 * Get rate limit logs
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
    const apiKeyId = params.api_key_id;
    const dateFrom = params.date_from;
    const dateTo = params.date_to;
    const limit = parseInt(params.limit || '50');
    const offset = parseInt(params.offset || '0');

    let query = supabase
      .from('rate_limit_logs')
      .select('*, api_keys:api_key_id(key, name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (apiKeyId) {
      query = query.eq('api_key_id', apiKeyId);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      return sendError('Failed to fetch rate limit logs', 'CN-5000', 500);
    }

    // Identify violations (remaining = 0)
    const violations = (logs || []).filter(log => log.remaining === 0);

    return sendSuccess({
      logs: logs || [],
      violations: violations,
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Rate limit list error:', error);
    return sendError('Failed to fetch rate limit logs', 'CN-5000', 500);
  }
};


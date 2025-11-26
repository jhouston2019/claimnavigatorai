/**
 * Get usage statistics
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

    const hours = parseInt(event.queryStringParameters?.hours || '24');
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Total requests
    const { count: totalRequests } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    // Success rate
    const { count: successCount } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)
      .gte('status', 200)
      .lt('status', 300);

    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;

    // By endpoint
    const { data: byEndpoint } = await supabase
      .from('api_usage_logs')
      .select('endpoint')
      .gte('created_at', since);

    const endpointCounts = {};
    if (byEndpoint) {
      byEndpoint.forEach(log => {
        const ep = log.endpoint || 'unknown';
        endpointCounts[ep] = (endpointCounts[ep] || 0) + 1;
      });
    }

    // Active API keys
    const { data: activeKeys } = await supabase
      .from('api_usage_logs')
      .select('api_key_id')
      .gte('created_at', since)
      .not('api_key_id', 'is', null);

    const uniqueKeys = new Set();
    if (activeKeys) {
      activeKeys.forEach(log => {
        if (log.api_key_id) uniqueKeys.add(log.api_key_id);
      });
    }

    return sendSuccess({
      total_requests: totalRequests || 0,
      success_rate: Math.round(successRate * 100) / 100,
      active_api_keys: uniqueKeys.size,
      by_endpoint: endpointCounts,
      time_range_hours: hours
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return sendError('Failed to fetch usage stats', 'CN-5000', 500);
  }
};


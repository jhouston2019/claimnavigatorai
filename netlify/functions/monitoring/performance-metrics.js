/**
 * Get performance metrics (latency, throughput)
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

function calculatePercentile(data, percentile) {
  if (!data || data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
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
    const endpoint = event.queryStringParameters?.endpoint;

    let query = supabase
      .from('api_usage_logs')
      .select('latency_ms, endpoint, created_at')
      .gte('created_at', since);

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { data: logs, error } = await query;

    if (error) {
      return sendError('Failed to fetch performance metrics', 'CN-5000', 500);
    }

    const latencies = (logs || []).map(l => l.latency_ms || 0).filter(l => l > 0);

    // Calculate percentiles
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    const avg = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    // Calculate throughput (requests per minute)
    const requestsPerMinute = logs ? logs.length / (hours * 60) : 0;

    // Group by endpoint
    const byEndpoint = {};
    if (logs) {
      logs.forEach(log => {
        const ep = log.endpoint || 'unknown';
        if (!byEndpoint[ep]) {
          byEndpoint[ep] = { latencies: [], count: 0 };
        }
        if (log.latency_ms) {
          byEndpoint[ep].latencies.push(log.latency_ms);
        }
        byEndpoint[ep].count++;
      });
    }

    const endpointMetrics = Object.entries(byEndpoint).map(([ep, data]) => ({
      endpoint: ep,
      p50: calculatePercentile(data.latencies, 50),
      p95: calculatePercentile(data.latencies, 95),
      p99: calculatePercentile(data.latencies, 99),
      requests: data.count
    }));

    return sendSuccess({
      p50_latency: Math.round(p50),
      p95_latency: Math.round(p95),
      p99_latency: Math.round(p99),
      avg_latency: Math.round(avg),
      throughput_per_minute: Math.round(requestsPerMinute * 100) / 100,
      total_requests: logs?.length || 0,
      by_endpoint: endpointMetrics,
      time_range_hours: hours
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    return sendError('Failed to fetch performance metrics', 'CN-5000', 500);
  }
};


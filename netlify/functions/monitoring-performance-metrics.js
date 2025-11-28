/**
 * Get performance metrics (latency, throughput)
 */

const { createClient } = require('@supabase/supabase-js');
const requireAdmin = require('./_admin-auth');

function calculatePercentile(data, percentile) {
  if (!data || data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

exports.handler = async (event) => {
  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: auth.error
      })
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const hours = parseInt(event.queryStringParameters?.hours || '24');
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const functionName = event.queryStringParameters?.function_name;

    let query = supabase
      .from('api_usage_logs')
      .select('duration_ms, function_name, created_at')
      .gte('created_at', since);

    if (functionName) {
      query = query.eq('function_name', functionName);
    }

    const { data: logs, error } = await query;

    if (error) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            message: 'Failed to fetch performance metrics',
            code: 'CN-5001'
          }
        })
      };
    }

    const latencies = (logs || []).map(l => l.duration_ms || 0).filter(l => l > 0);

    // Calculate percentiles
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    const avg = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    // Calculate throughput (requests per minute)
    const requestsPerMinute = logs ? logs.length / (hours * 60) : 0;

    // Group by function
    const byFunction = {};
    if (logs) {
      logs.forEach(log => {
        const func = log.function_name || 'unknown';
        if (!byFunction[func]) {
          byFunction[func] = { latencies: [], count: 0 };
        }
        if (log.duration_ms) {
          byFunction[func].latencies.push(log.duration_ms);
        }
        byFunction[func].count++;
      });
    }

    const functionMetrics = Object.entries(byFunction).map(([func, data]) => ({
      function_name: func,
      p50: calculatePercentile(data.latencies, 50),
      p95: calculatePercentile(data.latencies, 95),
      p99: calculatePercentile(data.latencies, 99),
      requests: data.count
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          p50_latency: Math.round(p50),
          p95_latency: Math.round(p95),
          p99_latency: Math.round(p99),
          avg_latency: Math.round(avg),
          throughput_per_minute: Math.round(requestsPerMinute * 100) / 100,
          total_requests: logs?.length || 0,
          by_function: functionMetrics,
          time_range_hours: hours
        },
        error: null
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: {
          message: 'Failed to fetch performance metrics',
          code: 'CN-5000',
          detail: err.message
        }
      })
    };
  }
};

/**
 * Check service health and dependencies
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

async function checkSupabaseHealth(supabase) {
  try {
    const start = Date.now();
    const { error } = await supabase.from('ai_admins').select('id').limit(1);
    const latency = Date.now() - start;
    return {
      status: error ? 'down' : 'up',
      latency_ms: latency,
      error: error?.message
    };
  } catch (e) {
    return { status: 'down', latency_ms: 0, error: e.message };
  }
}

async function checkTables(supabase) {
  const requiredTables = [
    'ai_admins',
    'api_keys',
    'api_logs',
    'system_errors',
    'system_events',
    'api_usage_logs',
    'ai_cost_tracking',
    'rate_limit_logs'
  ];

  const results = {};
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      results[table] = !error;
    } catch (e) {
      results[table] = false;
    }
  }
  return results;
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

    // Check Supabase
    const supabaseHealth = await checkSupabaseHealth(supabase);

    // Check tables
    const tables = await checkTables(supabase);
    const allTablesExist = Object.values(tables).every(exists => exists);

    // Check API gateway (simulate)
    const apiGatewayHealth = {
      status: 'up',
      latency_ms: 0
    };

    // Check AI provider (simulate - would check OpenAI API)
    const aiProviderHealth = {
      status: process.env.OPENAI_API_KEY ? 'up' : 'down',
      latency_ms: 0
    };

    // Determine overall health
    const dependencies = [
      supabaseHealth.status,
      apiGatewayHealth.status,
      aiProviderHealth.status
    ];
    const allUp = dependencies.every(s => s === 'up') && allTablesExist;
    const anyDown = dependencies.some(s => s === 'down') || !allTablesExist;

    let overallStatus = 'healthy';
    if (anyDown) {
      overallStatus = 'down';
    } else if (supabaseHealth.latency_ms > 1000) {
      overallStatus = 'degraded';
    }

    // Calculate uptime (simplified - would track actual uptime)
    const uptime = allUp ? 99.9 : 95.0;

    return sendSuccess({
      overall_status: overallStatus,
      uptime_percent: uptime,
      dependencies: {
        supabase: supabaseHealth,
        api_gateway: apiGatewayHealth,
        ai_provider: aiProviderHealth,
        tables: tables
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Service health error:', error);
    return sendError('Failed to check service health', 'CN-5000', 500);
  }
};


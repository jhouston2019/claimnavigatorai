/**
 * Get AI cost tracking data
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
    const toolName = params.tool;
    const dateFrom = params.date_from;
    const dateTo = params.date_to;
    const limit = parseInt(params.limit || '100');
    const offset = parseInt(params.offset || '0');

    let query = supabase
      .from('ai_cost_tracking')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (toolName) {
      query = query.eq('tool_name', toolName);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: costs, error, count } = await query;

    if (error) {
      return sendError('Failed to fetch cost data', 'CN-5000', 500);
    }

    // Calculate totals
    const totals = (costs || []).reduce((acc, cost) => {
      acc.input_tokens += cost.input_tokens || 0;
      acc.output_tokens += cost.output_tokens || 0;
      acc.total_cost += parseFloat(cost.cost || 0);
      return acc;
    }, { input_tokens: 0, output_tokens: 0, total_cost: 0 });

    // Group by tool
    const byTool = {};
    if (costs) {
      costs.forEach(cost => {
        const tool = cost.tool_name || 'unknown';
        if (!byTool[tool]) {
          byTool[tool] = { input_tokens: 0, output_tokens: 0, cost: 0 };
        }
        byTool[tool].input_tokens += cost.input_tokens || 0;
        byTool[tool].output_tokens += cost.output_tokens || 0;
        byTool[tool].cost += parseFloat(cost.cost || 0);
      });
    }

    return sendSuccess({
      costs: costs || [],
      totals: {
        input_tokens: totals.input_tokens,
        output_tokens: totals.output_tokens,
        total_cost: Math.round(totals.total_cost * 10000) / 10000
      },
      by_tool: byTool,
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Cost list error:', error);
    return sendError('Failed to fetch cost data', 'CN-5000', 500);
  }
};


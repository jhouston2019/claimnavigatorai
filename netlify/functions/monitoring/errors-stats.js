/**
 * Get error statistics
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

    // Get error counts by tool
    const { data: byTool } = await supabase
      .from('system_errors')
      .select('tool_name')
      .gte('created_at', since);

    const toolCounts = {};
    if (byTool) {
      byTool.forEach(err => {
        const tool = err.tool_name || 'unknown';
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      });
    }

    // Get error counts by code
    const { data: byCode } = await supabase
      .from('system_errors')
      .select('error_code')
      .gte('created_at', since);

    const codeCounts = {};
    if (byCode) {
      byCode.forEach(err => {
        const code = err.error_code || 'unknown';
        codeCounts[code] = (codeCounts[code] || 0) + 1;
      });
    }

    // Total errors
    const { count: totalErrors } = await supabase
      .from('system_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    return sendSuccess({
      total_errors: totalErrors || 0,
      by_tool: toolCounts,
      by_code: codeCounts,
      time_range_hours: hours
    });
  } catch (error) {
    console.error('Errors stats error:', error);
    return sendError('Failed to fetch error stats', 'CN-5000', 500);
  }
};


/**
 * Get dashboard statistics
 */

const { getSupabaseClient, sendSuccess, sendError } = require('../../api/lib/api-utils');

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

    // Get stats
    const [toolsResult, versionsResult, changesResult, adminsResult] = await Promise.all([
      supabase.from('ai_prompt_versions').select('tool_name', { count: 'exact' }),
      supabase.from('ai_prompt_versions').select('id', { count: 'exact' }),
      supabase.from('ai_change_log').select('id', { count: 'exact' }).gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('ai_admins').select('id', { count: 'exact' })
    ]);

    return sendSuccess({
      totalTools: toolsResult.count || 0,
      totalVersions: versionsResult.count || 0,
      recentChanges: changesResult.count || 0,
      activeAdmins: adminsResult.count || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return sendError('Failed to get stats', 'CN-5000', 500);
  }
};



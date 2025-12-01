/**
 * List versions for a tool/type
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

    const type = event.queryStringParameters?.type; // prompt, ruleset, example, output
    const tool = event.queryStringParameters?.tool;

    let tableName, nameField;
    switch (type) {
      case 'prompt':
        tableName = 'ai_prompt_versions';
        nameField = 'tool_name';
        break;
      case 'ruleset':
        tableName = 'ai_ruleset_versions';
        nameField = 'ruleset_name';
        break;
      case 'example':
        tableName = 'ai_example_versions';
        nameField = 'tool_name';
        break;
      case 'output':
        tableName = 'ai_output_format_versions';
        nameField = 'tool_name';
        break;
      default:
        return sendError('Invalid type. Must be: prompt, ruleset, example, or output', 'CN-1000', 400);
    }

    let query = supabase
      .from(tableName)
      .select('*')
      .order('version', { ascending: false })
      .limit(50);

    if (tool) {
      query = query.eq(nameField, tool);
    }

    const { data: versions, error } = await query;

    if (error) {
      return sendError('Failed to list versions', 'CN-5000', 500);
    }

    return sendSuccess({
      versions: versions || [],
      type,
      tool
    });
  } catch (error) {
    console.error('List versions error:', error);
    return sendError('Failed to list versions', 'CN-5000', 500);
  }
};



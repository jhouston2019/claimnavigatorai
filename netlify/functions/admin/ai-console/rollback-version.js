/**
 * Rollback to a specific version
 */

const { getSupabaseClient, sendSuccess, sendError, parseBody } = require('../../api/lib/api-utils');

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

    const body = parseBody(event.body);
    if (!body.type || !body.target_version || !body.tool_name) {
      return sendError('Missing type, target_version, or tool_name', 'CN-1000', 400);
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

    const { data: admin } = await supabase
      .from('ai_admins')
      .select('email')
      .eq('user_id', user.id)
      .single();

    let tableName, nameField, contentField;
    switch (body.type) {
      case 'prompt':
        tableName = 'ai_prompt_versions';
        nameField = 'tool_name';
        contentField = 'prompt';
        break;
      case 'ruleset':
        tableName = 'ai_ruleset_versions';
        nameField = 'ruleset_name';
        contentField = 'rules';
        break;
      case 'example':
        tableName = 'ai_example_versions';
        nameField = 'tool_name';
        contentField = 'examples';
        break;
      case 'output':
        tableName = 'ai_output_format_versions';
        nameField = 'tool_name';
        contentField = 'output_format';
        break;
      default:
        return sendError('Invalid type', 'CN-1000', 400);
    }

    // Get target version
    const { data: targetVersion, error: getError } = await supabase
      .from(tableName)
      .select('*')
      .eq(nameField, body.tool_name)
      .eq('version', body.target_version)
      .single();

    if (getError || !targetVersion) {
      return sendError('Version not found', 'CN-1002', 404);
    }

    // Get current version
    const { data: current } = await supabase
      .from(tableName)
      .select('version')
      .eq(nameField, body.tool_name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (current?.version || 0) + 1;

    // Create new version with content from target version
    const rollbackData = {
      [nameField]: body.tool_name,
      version: newVersion,
      [contentField]: targetVersion[contentField],
      updated_by: user.id,
      diff: `Rollback to version ${body.target_version}`
    };

    const { data: saved, error: saveError } = await supabase
      .from(tableName)
      .insert(rollbackData)
      .select()
      .single();

    if (saveError) {
      return sendError('Failed to rollback', 'CN-5000', 500);
    }

    // Log rollback
    await supabase
      .from('ai_change_log')
      .insert({
        action_type: 'rollback',
        tool: body.tool_name,
        user_id: user.id,
        user_email: admin.email,
        before: { version: current?.version || 0 },
        after: { version: newVersion, rolled_back_from: body.target_version },
        diff: `Rollback to version ${body.target_version}`
      });

    return sendSuccess({
      version: newVersion,
      rolled_back_from: body.target_version,
      tool_name: body.tool_name,
      created_at: saved.created_at
    });
  } catch (error) {
    console.error('Rollback error:', error);
    return sendError('Failed to rollback', 'CN-5000', 500);
  }
};



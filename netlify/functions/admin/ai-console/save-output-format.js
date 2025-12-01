/**
 * Save output format with versioning
 */

const { getSupabaseClient, sendSuccess, sendError, parseBody } = require('../../api/lib/api-utils');

function calculateDiff(oldFormat, newFormat) {
  if (!oldFormat) return 'New output format';
  try {
    const oldStr = JSON.stringify(oldFormat);
    const newStr = JSON.stringify(newFormat);
    if (oldStr === newStr) return 'No changes';
    return `Changed: ${oldStr.length} → ${newStr.length} bytes`;
  } catch (e) {
    return 'Changes detected';
  }
}

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    const body = parseBody(event.body);
    if (!body.tool_name || !body.output_format) {
      return sendError('Missing tool_name or output_format', 'CN-1000', 400);
    }

    // Validate output_format is object
    if (typeof body.output_format !== 'object') {
      return sendError('Output format must be a valid JSON object', 'CN-1000', 400);
    }

    // Validate required keys
    if (!body.output_format.type) {
      return sendError('Output format must have a "type" property', 'CN-1000', 400);
    }

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError('Unauthorized', 'CN-2000', 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return sendError('Invalid token', 'CN-2000', 401);
    }

    const { data: admin } = await supabase
      .from('ai_admins')
      .select('role, email')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return sendError('Admin access required', 'CN-2001', 403);
    }

    const { data: current } = await supabase
      .from('ai_output_format_versions')
      .select('version, output_format')
      .eq('tool_name', body.tool_name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (current?.version || 0) + 1;
    const diff = calculateDiff(current?.output_format || null, body.output_format);

    if (newVersion > 30) {
      await supabase
        .from('ai_output_format_versions')
        .delete()
        .eq('tool_name', body.tool_name)
        .order('version', { ascending: true })
        .limit(1);
    }

    const { data: saved, error: saveError } = await supabase
      .from('ai_output_format_versions')
      .insert({
        tool_name: body.tool_name,
        version: newVersion,
        output_format: body.output_format,
        updated_by: user.id,
        diff: diff
      })
      .select()
      .single();

    if (saveError) {
      return sendError('Failed to save output format', 'CN-5000', 500);
    }

    await supabase
      .from('ai_change_log')
      .insert({
        action_type: 'output_format_saved',
        tool: body.tool_name,
        user_id: user.id,
        user_email: admin.email,
        before: current ? { output_format: current.output_format } : null,
        after: { output_format: body.output_format },
        diff: diff
      });

    return sendSuccess({
      version: newVersion,
      tool_name: body.tool_name,
      created_at: saved.created_at
    });
  } catch (error) {
    console.error('Save output format error:', error);
    return sendError('Failed to save output format', 'CN-5000', 500);
  }
};



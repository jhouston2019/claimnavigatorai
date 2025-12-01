/**
 * Save examples with versioning
 */

const { getSupabaseClient, sendSuccess, sendError, parseBody } = require('../../api/lib/api-utils');

function calculateDiff(oldExamples, newExamples) {
  if (!oldExamples) return 'New examples';
  try {
    const oldStr = JSON.stringify(oldExamples);
    const newStr = JSON.stringify(newExamples);
    if (oldStr === newStr) return 'No changes';
    return `Changed: ${oldExamples.length} → ${newExamples.length} examples`;
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
    if (!body.tool_name || !body.examples) {
      return sendError('Missing tool_name or examples', 'CN-1000', 400);
    }

    // Validate examples is array
    if (!Array.isArray(body.examples)) {
      return sendError('Examples must be an array', 'CN-1000', 400);
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
      .from('ai_example_versions')
      .select('version, examples')
      .eq('tool_name', body.tool_name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (current?.version || 0) + 1;
    const diff = calculateDiff(current?.examples || null, body.examples);

    if (newVersion > 30) {
      await supabase
        .from('ai_example_versions')
        .delete()
        .eq('tool_name', body.tool_name)
        .order('version', { ascending: true })
        .limit(1);
    }

    const { data: saved, error: saveError } = await supabase
      .from('ai_example_versions')
      .insert({
        tool_name: body.tool_name,
        version: newVersion,
        examples: body.examples,
        updated_by: user.id,
        diff: diff
      })
      .select()
      .single();

    if (saveError) {
      return sendError('Failed to save examples', 'CN-5000', 500);
    }

    await supabase
      .from('ai_change_log')
      .insert({
        action_type: 'examples_saved',
        tool: body.tool_name,
        user_id: user.id,
        user_email: admin.email,
        before: current ? { examples: current.examples } : null,
        after: { examples: body.examples },
        diff: diff
      });

    return sendSuccess({
      version: newVersion,
      tool_name: body.tool_name,
      created_at: saved.created_at
    });
  } catch (error) {
    console.error('Save examples error:', error);
    return sendError('Failed to save examples', 'CN-5000', 500);
  }
};



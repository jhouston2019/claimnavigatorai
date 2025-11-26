/**
 * Save ruleset with versioning
 */

const { getSupabaseClient, sendSuccess, sendError, parseBody } = require('../../api/lib/api-utils');

function calculateDiff(oldRules, newRules) {
  if (!oldRules) return 'New ruleset';
  try {
    const oldStr = JSON.stringify(oldRules);
    const newStr = JSON.stringify(newRules);
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
    if (!body.ruleset_name || !body.rules) {
      return sendError('Missing ruleset_name or rules', 'CN-1000', 400);
    }

    // Validate JSON
    if (typeof body.rules !== 'object') {
      return sendError('Rules must be a valid JSON object', 'CN-1000', 400);
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
      .from('ai_ruleset_versions')
      .select('version, rules')
      .eq('ruleset_name', body.ruleset_name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (current?.version || 0) + 1;
    const diff = calculateDiff(current?.rules || null, body.rules);

    if (newVersion > 30) {
      await supabase
        .from('ai_ruleset_versions')
        .delete()
        .eq('ruleset_name', body.ruleset_name)
        .order('version', { ascending: true })
        .limit(1);
    }

    const { data: saved, error: saveError } = await supabase
      .from('ai_ruleset_versions')
      .insert({
        ruleset_name: body.ruleset_name,
        version: newVersion,
        rules: body.rules,
        updated_by: user.id,
        diff: diff
      })
      .select()
      .single();

    if (saveError) {
      return sendError('Failed to save ruleset', 'CN-5000', 500);
    }

    await supabase
      .from('ai_change_log')
      .insert({
        action_type: 'ruleset_saved',
        tool: body.ruleset_name,
        user_id: user.id,
        user_email: admin.email,
        before: current ? { rules: current.rules } : null,
        after: { rules: body.rules },
        diff: diff
      });

    return sendSuccess({
      version: newVersion,
      ruleset_name: body.ruleset_name,
      created_at: saved.created_at
    });
  } catch (error) {
    console.error('Save ruleset error:', error);
    return sendError('Failed to save ruleset', 'CN-5000', 500);
  }
};


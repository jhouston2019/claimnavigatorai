/**
 * Save prompt with versioning
 */

const { getSupabaseClient, sendSuccess, sendError, parseBody } = require('../../api/lib/api-utils');

// Simple diff calculation
function calculateDiff(oldText, newText) {
  if (!oldText) return `+${newText.length} characters`;
  if (oldText === newText) return 'No changes';
  return `Changed: ${oldText.length} → ${newText.length} characters`;
}

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Parse body
    const body = parseBody(event.body);
    if (!body.tool_name || !body.prompt) {
      return sendError('Missing tool_name or prompt', 'CN-1000', 400);
    }

    // Validate prompt length
    if (body.prompt.length > 10000) {
      return sendError('Prompt exceeds maximum length of 10,000 characters', 'CN-1001', 400);
    }

    // Get user from auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError('Unauthorized', 'CN-2000', 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return sendError('Invalid token', 'CN-2000', 401);
    }

    // Check admin
    const { data: admin } = await supabase
      .from('ai_admins')
      .select('role, email')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return sendError('Admin access required', 'CN-2001', 403);
    }

    // Get current version
    const { data: current } = await supabase
      .from('ai_prompt_versions')
      .select('version, prompt')
      .eq('tool_name', body.tool_name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (current?.version || 0) + 1;
    const diff = calculateDiff(current?.prompt || '', body.prompt);

    // Enforce max 30 versions
    if (newVersion > 30) {
      // Delete oldest version
      await supabase
        .from('ai_prompt_versions')
        .delete()
        .eq('tool_name', body.tool_name)
        .order('version', { ascending: true })
        .limit(1);
    }

    // Save new version
    const { data: saved, error: saveError } = await supabase
      .from('ai_prompt_versions')
      .insert({
        tool_name: body.tool_name,
        version: newVersion,
        prompt: body.prompt,
        updated_by: user.id,
        diff: diff
      })
      .select()
      .single();

    if (saveError) {
      return sendError('Failed to save prompt', 'CN-5000', 500);
    }

    // Log to change log
    await supabase
      .from('ai_change_log')
      .insert({
        action_type: 'prompt_saved',
        tool: body.tool_name,
        user_id: user.id,
        user_email: admin.email,
        before: current ? { prompt: current.prompt } : null,
        after: { prompt: body.prompt },
        diff: diff
      });

    // Record system event
    const { recordEvent } = require('../../lib/monitoring-event-helper');
    await recordEvent('ai.config.updated', 'ai-console', {
      type: 'prompt',
      tool_name: body.tool_name,
      version: newVersion
    });

    return sendSuccess({
      version: newVersion,
      tool_name: body.tool_name,
      created_at: saved.created_at
    });
  } catch (error) {
    console.error('Save prompt error:', error);
    return sendError('Failed to save prompt', 'CN-5000', 500);
  }
};


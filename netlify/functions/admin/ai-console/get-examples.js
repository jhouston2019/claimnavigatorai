/**
 * Get examples for tools
 */

const { getSupabaseClient, sendSuccess, sendError } = require('../../api/lib/api-utils');
const fs = require('fs');
const path = require('path');

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

    const toolName = event.queryStringParameters?.tool;

    if (toolName) {
      const { data: version } = await supabase
        .from('ai_example_versions')
        .select('*')
        .eq('tool_name', toolName)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!version) {
        // Try local file
        try {
          const examplesPath = path.join(__dirname, '../../../app/assets/ai/examples', `${toolName}.json`);
          if (fs.existsSync(examplesPath)) {
            const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'));
            return sendSuccess({ examples: Array.isArray(examples) ? examples : [examples], version: 0 });
          }
        } catch (e) {
          // Ignore
        }
        return sendSuccess({ examples: [], version: 0 });
      }

      return sendSuccess({
        examples: version.examples,
        version: version.version,
        created_at: version.created_at
      });
    } else {
      const { data: tools } = await supabase
        .from('ai_example_versions')
        .select('tool_name')
        .order('tool_name');

      const toolSet = new Set();
      if (tools) {
        tools.forEach(t => toolSet.add(t.tool_name));
      }

      return sendSuccess({
        tools: Array.from(toolSet).sort()
      });
    }
  } catch (error) {
    console.error('Get examples error:', error);
    return sendError('Failed to get examples', 'CN-5000', 500);
  }
};



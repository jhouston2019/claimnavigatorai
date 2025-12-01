/**
 * Get prompts for tools
 * Returns list of tools or specific tool prompt
 */

const { getSupabaseClient, sendSuccess, sendError } = require('../../api/lib/api-utils');
const fs = require('fs');
const path = require('path');

// Helper to check admin
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
    if (!(await checkAdmin(supabase, user.id))) {
      return sendError('Admin access required', 'CN-2001', 403);
    }

    const toolName = event.queryStringParameters?.tool;

    if (toolName) {
      // Get specific tool prompt (latest version)
      const { data: version, error } = await supabase
        .from('ai_prompt_versions')
        .select('*')
        .eq('tool_name', toolName)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Try fallback to local file
        try {
          const configPath = path.join(__dirname, '../../../app/assets/ai/config/advanced-tools-config.json');
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const toolConfig = config[toolName];
            return sendSuccess({
              prompt: toolConfig?.systemPrompt || '',
              version: 0,
              created_at: null,
              updated_by: null
            });
          }
        } catch (e) {
          // Ignore
        }
        return sendError('Prompt not found', 'CN-1002', 404);
      }

      return sendSuccess({
        prompt: version?.prompt || '',
        version: version?.version || 0,
        created_at: version?.created_at,
        updated_by: version?.updated_by,
        updated_by_email: version?.updated_by_email || null
      });
    } else {
      // Get list of all tools
      const { data: tools } = await supabase
        .from('ai_prompt_versions')
        .select('tool_name')
        .order('tool_name');

      const toolSet = new Set();
      if (tools) {
        tools.forEach(t => toolSet.add(t.tool_name));
      }

      // Also check local config for tools not yet in DB
      try {
        const configPath = path.join(__dirname, '../../../app/assets/ai/config/advanced-tools-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          Object.keys(config).forEach(tool => toolSet.add(tool));
        }
      } catch (e) {
        // Ignore
      }

      return sendSuccess({
        tools: Array.from(toolSet).sort()
      });
    }
  } catch (error) {
    console.error('Get prompts error:', error);
    return sendError('Failed to get prompts', 'CN-5000', 500);
  }
};



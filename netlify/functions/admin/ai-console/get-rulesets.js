/**
 * Get rulesets
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

    const rulesetName = event.queryStringParameters?.ruleset;

    if (rulesetName) {
      const { data: version } = await supabase
        .from('ai_ruleset_versions')
        .select('*')
        .eq('ruleset_name', rulesetName)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!version) {
        // Try local file
        try {
          const rulesPath = path.join(__dirname, '../../../app/assets/ai/rules', `${rulesetName}.json`);
          if (fs.existsSync(rulesPath)) {
            const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
            return sendSuccess({ rules, version: 0 });
          }
        } catch (e) {
          // Ignore
        }
        return sendError('Ruleset not found', 'CN-1002', 404);
      }

      return sendSuccess({
        rules: version.rules,
        version: version.version,
        created_at: version.created_at
      });
    } else {
      const { data: rulesets } = await supabase
        .from('ai_ruleset_versions')
        .select('ruleset_name')
        .order('ruleset_name');

      const rulesetSet = new Set();
      if (rulesets) {
        rulesets.forEach(r => rulesetSet.add(r.ruleset_name));
      }

      // Check local files
      try {
        const rulesDir = path.join(__dirname, '../../../app/assets/ai/rules');
        if (fs.existsSync(rulesDir)) {
          const files = fs.readdirSync(rulesDir);
          files.forEach(f => {
            if (f.endsWith('.json')) {
              rulesetSet.add(f.replace('.json', ''));
            }
          });
        }
      } catch (e) {
        // Ignore
      }

      return sendSuccess({
        rulesets: Array.from(rulesetSet).sort()
      });
    }
  } catch (error) {
    console.error('Get rulesets error:', error);
    return sendError('Failed to get rulesets', 'CN-5000', 500);
  }
};



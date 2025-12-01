/**
 * Check if user is admin
 * Validates admin access for AI console
 */

const { getSupabaseClient, sendSuccess, sendError } = require('../../api/lib/api-utils');

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Get user from auth token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError('Unauthorized', 'CN-2000', 401);
    }

    const token = authHeader.substring(7);
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return sendError('Invalid token', 'CN-2000', 401);
    }

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from('ai_admins')
      .select('role, email')
      .eq('user_id', user.id)
      .single();

    if (adminError || !admin) {
      return sendSuccess({
        isAdmin: false,
        role: null,
        user: null
      });
    }

    return sendSuccess({
      isAdmin: true,
      role: admin.role,
      user: {
        id: user.id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Check admin error:', error);
    return sendError('Failed to check admin status', 'CN-5000', 500);
  }
};



/**
 * API Endpoint: /alerts/list
 * Lists compliance alerts for user
 */

const { getSupabaseClient, sendSuccess, sendError } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { userId, body } = event;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Parse query params
    const resolved = body?.resolved === true || body?.resolved === 'true';
    const limit = parseInt(body?.limit || '50');
    const offset = parseInt(body?.offset || '0');

    // Build query
    let query = supabase
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (resolved) {
      query = query.not('resolved_at', 'is', null);
    } else {
      query = query.is('resolved_at', null);
    }

    const { data: alerts, error } = await query;

    if (error) {
      return sendError('Failed to retrieve alerts', 'CN-5001', 500, { databaseError: error.message });
    }

    return sendSuccess({
      alerts: alerts || [],
      count: alerts?.length || 0,
      resolved: resolved,
      limit: limit,
      offset: offset
    });

  } catch (error) {
    console.error('Alerts List API Error:', error);
    
    try {
      return sendError('Failed to list alerts', 'CN-5000', 500, { errorType: error.name });
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            code: 'CN-9000',
            message: 'Critical system failure'
          }
        })
      };
    }
  }
};


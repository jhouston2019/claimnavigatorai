/**
 * Record system event endpoint
 */

const { getSupabaseClient, sendSuccess, sendError, parseBody } = require('../lib/api-utils');

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    const body = parseBody(event.body);
    if (!body.event_type || !body.source) {
      return sendError('Missing event_type or source', 'CN-1000', 400);
    }

    // Insert event (no auth required - system can insert)
    const { data, error } = await supabase
      .from('system_events')
      .insert({
        event_type: body.event_type,
        source: body.source,
        metadata: body.metadata || {}
      })
      .select()
      .single();

    if (error) {
      return sendError('Failed to record event', 'CN-5000', 500);
    }

    return sendSuccess({
      event_id: data.id,
      recorded_at: data.created_at
    });
  } catch (error) {
    console.error('Record event error:', error);
    return sendError('Failed to record event', 'CN-5000', 500);
  }
};


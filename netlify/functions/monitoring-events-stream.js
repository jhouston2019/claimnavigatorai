/**
 * Get system events stream
 */

const { createClient } = require('@supabase/supabase-js');
const requireAdmin = require('./_admin-auth');

exports.handler = async (event) => {
  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: auth.error
      })
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const params = event.queryStringParameters || {};
    const eventType = params.event_type;
    const source = params.source;
    const since = params.since || new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const limit = parseInt(params.limit || '100');

    let query = supabase
      .from('system_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (source) {
      query = query.eq('source', source);
    }

    const { data: events, error } = await query;

    if (error) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            message: 'Failed to fetch events',
            code: 'CN-5001'
          }
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          events: events || [],
          count: events?.length || 0,
          since: since
        },
        error: null
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: {
          message: 'Failed to fetch events',
          code: 'CN-5000',
          detail: err.message
        }
      })
    };
  }
};

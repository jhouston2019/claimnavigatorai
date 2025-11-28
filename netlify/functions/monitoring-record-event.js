/**
 * Record system event endpoint
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Parse body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
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
            message: 'Invalid JSON body',
            code: 'CN-1000'
          }
        })
      };
    }

    if (!body.event_type || !body.source) {
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
            message: 'Missing event_type or source',
            code: 'CN-1000'
          }
        })
      };
    }

    // Insert event (no auth required - system can insert)
    const { data, error } = await supabase
      .from('system_events')
      .insert({
        event_type: body.event_type,
        source: body.source,
        payload: body.payload || {}
      })
      .select()
      .single();

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
            message: 'Failed to record event',
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
          event_id: data.id,
          recorded_at: data.created_at
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
          message: 'Failed to record event',
          code: 'CN-5000',
          detail: err.message
        }
      })
    };
  }
};

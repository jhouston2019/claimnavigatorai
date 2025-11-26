/**
 * API Endpoint: /alerts/resolve
 * Resolves a compliance alert
 */

const { getSupabaseClient, sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Validate input
    const schema = {
      alert_id: { required: true, type: 'string' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'CN-1000', 400);
    }

    // Verify alert belongs to user
    const { data: alert, error: fetchError } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('id', body.alert_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !alert) {
      return sendError('Alert not found', 'CN-7000', 404, { alert_id: body.alert_id });
    }

    // Resolve alert
    const { data: updatedAlert, error: updateError } = await supabase
      .from('compliance_alerts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', body.alert_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return sendError('Failed to resolve alert', 'CN-5001', 500, { databaseError: updateError.message });
    }

    return sendSuccess({
      alert: updatedAlert,
      resolved_at: updatedAlert.resolved_at
    });

  } catch (error) {
    console.error('Alerts Resolve API Error:', error);
    
    try {
      return sendError('Failed to resolve alert', 'CN-5000', 500, { errorType: error.name });
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


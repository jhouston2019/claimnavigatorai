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
      return sendError('Database not configured', 'CONFIG_ERROR', 500);
    }

    // Validate input
    const schema = {
      alert_id: { required: true, type: 'string' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'VALIDATION_ERROR', 400);
    }

    // Verify alert belongs to user
    const { data: alert, error: fetchError } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('id', body.alert_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !alert) {
      return sendError('Alert not found', 'NOT_FOUND', 404);
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
      return sendError('Failed to resolve alert', 'DATABASE_ERROR', 500);
    }

    return sendSuccess({
      alert: updatedAlert,
      resolved_at: updatedAlert.resolved_at
    });

  } catch (error) {
    console.error('Alerts Resolve API Error:', error);
    return sendError('Failed to resolve alert', 'INTERNAL_ERROR', 500);
  }
};


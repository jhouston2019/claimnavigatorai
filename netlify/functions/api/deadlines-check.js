/**
 * API Endpoint: /deadlines/check
 * Checks statutory and carrier deadlines
 */

const { getSupabaseClient, sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;

    // Validate input
    const schema = {
      state: { required: true, type: 'string' },
      carrier: { required: false, type: 'string' },
      claimType: { required: false, type: 'string' },
      dateOfLoss: { required: false, type: 'string' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'VALIDATION_ERROR', 400);
    }

    // Get deadlines from compliance engine
    const applyDeadlines = require('../../compliance-engine/apply-deadlines');
    
    const deadlineResult = await applyDeadlines.handler({
      ...event,
      body: JSON.stringify({
        state: body.state,
        carrier: body.carrier,
        claimType: body.claimType || 'Property',
        events: body.dateOfLoss ? [{ date: body.dateOfLoss, name: 'Date of Loss' }] : []
      }),
      httpMethod: 'POST',
      headers: event.headers
    });

    if (deadlineResult.statusCode !== 200) {
      const errorData = JSON.parse(deadlineResult.body || '{}');
      return sendError(errorData.error || 'Failed to retrieve deadlines', 'DEADLINE_ERROR', deadlineResult.statusCode);
    }

    const deadlineData = JSON.parse(deadlineResult.body || '{}');

    // Also check database for user-specific deadlines
    const supabase = getSupabaseClient();
    let userDeadlines = [];
    
    if (supabase && userId) {
      const { data } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('date', { ascending: true });

      userDeadlines = data || [];
    }

    return sendSuccess({
      statutory: deadlineData.deadlines || [],
      carrier: deadlineData.carrierDeadlines || [],
      user_defined: userDeadlines,
      state: body.state,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deadlines Check API Error:', error);
    return sendError('Failed to check deadlines', 'INTERNAL_ERROR', 500);
  }
};


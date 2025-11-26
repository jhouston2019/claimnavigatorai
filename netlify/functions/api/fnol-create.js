/**
 * API Endpoint: /fnol/create
 * Creates a new FNOL submission
 */

const fnolSubmit = require('../../fnol-submit');
const { getSupabaseClient, sendSuccess, sendError } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId, user } = event;

    // Validate required fields
    if (!body.policyholder || !body.policy || !body.loss) {
      return sendError('Missing required fields: policyholder, policy, loss', 'VALIDATION_ERROR', 400);
    }

    // Build FNOL payload
    const fnolPayload = {
      policyholder: body.policyholder,
      policy: body.policy,
      property: body.property || {},
      loss: body.loss,
      damage: body.damage || {},
      impact: body.impact || {},
      evidenceFiles: body.evidenceFiles || {},
      timestamps: {
        createdAt: new Date().toISOString()
      }
    };

    // Call existing FNOL submit function logic
    // Import the function handler
    const fnolSubmit = require('../../fnol-submit');
    
    const result = await fnolSubmit.handler({
      ...event,
      body: JSON.stringify(fnolPayload),
      httpMethod: 'POST',
      headers: event.headers
    });

    if (result.statusCode !== 200) {
      const errorData = JSON.parse(result.body || '{}');
      return sendError(errorData.error || 'FNOL creation failed', 'FNOL_ERROR', result.statusCode);
    }

    const fnolData = JSON.parse(result.body || '{}');

    // Return standardized response
    return sendSuccess({
      fnol_id: fnolData.fnolId || fnolData.id,
      pdf_url: fnolData.pdfUrl,
      status: fnolData.status || 'submitted',
      submitted_at: fnolData.submittedAt || new Date().toISOString()
    }, 201);

  } catch (error) {
    console.error('FNOL Create API Error:', error);
    return sendError('Failed to create FNOL', 'INTERNAL_ERROR', 500);
  }
};


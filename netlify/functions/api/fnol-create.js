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
      return sendError('Missing required fields: policyholder, policy, loss', 'CN-1000', 400);
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
      return sendError(
        errorData.error || 'FNOL creation failed',
        'CN-5000',
        result.statusCode,
        { originalError: errorData.error }
      );
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
    
    // Wrap in try/catch for resilience
    try {
      return sendError(
        'Failed to create FNOL',
        'CN-5000',
        500,
        { errorType: error.name }
      );
    } catch (fallbackError) {
      // Ultimate fallback
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


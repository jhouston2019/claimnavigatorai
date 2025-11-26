/**
 * API Endpoint: /policy/compare
 * Compares two insurance policies
 */

const { sendSuccess, sendError, validateSchema, sanitizeInput } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;

    // Validate input
    const schema = {
      policy_a_url: { required: true, type: 'string', maxLength: 2048 },
      policy_b_url: { required: true, type: 'string', maxLength: 2048 }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'CN-1000', 400);
    }

    // Sanitize and validate URLs
    const sanitizedUrlA = sanitizeInput(body.policy_a_url, 2048);
    const sanitizedUrlB = sanitizeInput(body.policy_b_url, 2048);

    // Validate URL format and protocol
    try {
      const urlA = new URL(sanitizedUrlA);
      const urlB = new URL(sanitizedUrlB);
      
      if (urlA.protocol !== 'https:' || urlB.protocol !== 'https:') {
        return sendError('Policy URLs must use HTTPS protocol', 'CN-1001', 400);
      }
    } catch (e) {
      return sendError('Invalid policy URL format', 'CN-1000', 400);
    }

    // Call policy comparison tool
    const policyCompare = require('../../advanced-tools/policy-comparison-tool');
    
    const result = await policyCompare.handler({
      ...event,
      body: JSON.stringify({
        policyAUrl: body.policy_a_url,
        policyBUrl: body.policy_b_url
      }),
      httpMethod: 'POST',
      headers: event.headers
    });

    if (result.statusCode !== 200) {
      const errorData = JSON.parse(result.body || '{}');
      return sendError(
        errorData.error || 'Policy comparison failed',
        'CN-5003',
        result.statusCode,
        { originalError: errorData.error }
      );
    }

    const comparisonData = JSON.parse(result.body);

    return sendSuccess({
      comparison_id: comparisonData.id,
      differences: comparisonData.differences || [],
      similarities: comparisonData.similarities || [],
      recommendations: comparisonData.recommendations || [],
      compared_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Policy Compare API Error:', error);
    
    try {
      return sendError('Failed to compare policies', 'CN-5000', 500, { errorType: error.name });
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


/**
 * API Endpoint: /policy/compare
 * Compares two insurance policies
 */

const { sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;

    // Validate input
    const schema = {
      policy_a_url: { required: true, type: 'string' },
      policy_b_url: { required: true, type: 'string' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'VALIDATION_ERROR', 400);
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
      const errorData = JSON.parse(result.body);
      return sendError(errorData.error || 'Policy comparison failed', 'COMPARISON_ERROR', result.statusCode);
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
    return sendError('Failed to compare policies', 'INTERNAL_ERROR', 500);
  }
};


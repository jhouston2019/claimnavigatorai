/**
 * API Endpoint: /settlement/calc
 * Calculates settlement analysis
 */

const { sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;

    // Validate input
    const schema = {
      initial_offer: { required: true, type: 'number' },
      estimated_damage: { required: false, type: 'number' },
      policy_limits: { required: false, type: 'number' },
      deductible: { required: false, type: 'number' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'VALIDATION_ERROR', 400);
    }

    // Call settlement calculator
    const settlementCalc = require('../../advanced-tools/settlement-calculator-pro');
    
    const result = await settlementCalc.handler({
      ...event,
      body: JSON.stringify({
        initialOffer: body.initial_offer,
        estimatedDamage: body.estimated_damage,
        policyLimits: body.policy_limits,
        deductible: body.deductible,
        additionalFactors: body.additional_factors || {}
      }),
      httpMethod: 'POST',
      headers: event.headers
    });

    if (result.statusCode !== 200) {
      const errorData = JSON.parse(result.body);
      return sendError(errorData.error || 'Settlement calculation failed', 'CALCULATION_ERROR', result.statusCode);
    }

    const calcData = JSON.parse(result.body);

    return sendSuccess({
      calculation_id: calcData.id,
      initial_offer: body.initial_offer,
      recommended_range: calcData.recommendedRange || {},
      analysis: calcData.analysis || {},
      factors: calcData.factors || [],
      calculated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Settlement Calc API Error:', error);
    return sendError('Failed to calculate settlement', 'INTERNAL_ERROR', 500);
  }
};


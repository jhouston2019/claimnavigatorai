/**
 * API Endpoint: /compliance/analyze
 * Analyzes compliance and generates recommendations
 */

const { sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;

    // Validate input
    const schema = {
      state: { required: true, type: 'string' },
      carrier: { required: true, type: 'string' },
      claimType: { required: true, type: 'string' },
      events: { required: false, array: true }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'CN-1000', 400);
    }

    // Call compliance engine
    const complianceAnalyze = require('../../compliance-engine/analyze');
    
    const result = await complianceAnalyze.handler({
      ...event,
      body: JSON.stringify({
        state: body.state,
        carrier: body.carrier,
        claimType: body.claimType,
        events: body.events || [],
        letterFiles: body.letterFiles || [],
        policyFiles: body.policyFiles || []
      }),
      httpMethod: 'POST',
      headers: event.headers
    });

    if (result.statusCode !== 200) {
      const errorData = JSON.parse(result.body || '{}');
      return sendError(
        errorData.error || 'Compliance analysis failed',
        'CN-2001',
        result.statusCode,
        { originalError: errorData.error }
      );
    }

    const analysisData = JSON.parse(result.body);

    // Trigger alerts generation
    try {
      const generateAlerts = require('../../compliance-engine/generate-alerts');
      await generateAlerts.handler({
        ...event,
        body: JSON.stringify({
          state: body.state,
          carrier: body.carrier,
          claimType: body.claimType,
          claimId: body.claim_id || null
        }),
        httpMethod: 'POST'
      }).catch(err => {
        console.warn('Alert generation trigger failed:', err);
      });
    } catch (error) {
      console.warn('Alert trigger failed:', error);
      // Don't fail the request if alert trigger fails
    }

    return sendSuccess({
      violations: analysisData.violations || [],
      deadlines: analysisData.deadlines || [],
      recommendations: analysisData.recommendations || [],
      risk_score: analysisData.riskScore || 0,
      health_status: analysisData.healthStatus || 'unknown',
      analysis_date: new Date().toISOString()
    });

  } catch (error) {
    console.error('Compliance Analyze API Error:', error);
    
    try {
      return sendError(
        'Failed to analyze compliance',
        'CN-5000',
        500,
        { errorType: error.name }
      );
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


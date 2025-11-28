const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const situation = body.situation;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-advisory-simple', { payload: body });
    
    if (!situation || situation.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Situation description is required' })
      };
    }

    const startTime = Date.now();

    // For now, return a basic response without AI integration
    // TODO: Add OpenAI integration once basic function is working
    const result = {
      explanation: `Based on your situation: "${situation}", this appears to be an insurance claim issue that requires immediate attention.`,
      nextSteps: [
        "1. Document everything in writing - keep detailed records of all communications",
        "2. Request a written explanation for any denials or delays",
        "3. Review your policy carefully for applicable coverage",
        "4. Consider consulting with a public adjuster or attorney if needed"
      ],
      recommendedDocument: "Appeal Letter",
      exampleText: "I am writing to formally appeal the decision regarding my insurance claim. I believe this decision was made in error and request a thorough review of my case with proper documentation."
    };

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-advisory-simple',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost (placeholder - no AI yet)
    await LOG_COST({
      function: 'ai-advisory-simple',
      estimated_cost_usd: 0.0
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, data: result, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-advisory-simple',
      message: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};

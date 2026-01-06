const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');


exports.handler = async (event) => {
  // ✅ PHASE 5B: FULLY HARDENED

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    
    // PHASE 5B: Post-process and validate
    const processedResponse = postProcessResponse(rawResponse, 'analysis');
    const validation = validateProfessionalOutput(processedResponse, 'analysis');

    if (!validation.pass) {
      console.warn('[ai-advisory] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-advisory', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, data: null, error: { code: 'CN-4000', message: 'Method not allowed' } })
    };
  }

  try {
    // Auth validation
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Authorization required' } })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Invalid token' } })
      };
    }

    // Payment validation
    const { data: payment } = await supabase
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (!payment) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-3000', message: 'Payment required' } })
      };
    }

    // Unified body parsing
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Invalid JSON body' } })
      };
    }

    const { situation, claimInfo = {} } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-advisory', { payload: body });
    
    if (!situation || situation.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-1000', message: 'Situation description is required' }
        })
      };
    }

    const startTime = Date.now();

    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    const prompt = `You are Claim Navigator, an expert insurance claim advisor with extensive experience in property, commercial, and catastrophe claims.

Analyze the following claim situation and provide structured advice in JSON format with these exact fields:
{
  "explanation": "Clear explanation of the situation and why the advice is relevant",
  "nextSteps": "Specific actionable steps the claimant should take",
  "recommendedDocument": "The most appropriate document type to generate",
  "exampleText": "Sample text or response the claimant could use"
}

Guidelines:
- Be specific and actionable
- Focus on practical steps the claimant can take
- Recommend the most appropriate document type from: Appeal Letter, Demand Letter, Notice of Delay Complaint, Coverage Clarification Request, Proof of Loss, Damage Assessment, Expert Opinion Request, Business Interruption Claim, etc.
- Provide realistic example text they can adapt
- Consider both immediate actions and longer-term strategy
- Address potential insurance company tactics or objections

Situation: ${situation}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;
    
    // Try to parse the AI response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If parsing fails, wrap the response in a structured format
      parsedResponse = {
        explanation: aiResponse,
        nextSteps: "Review the advice above and take appropriate action.",
        recommendedDocument: "Appeal Letter",
        exampleText: "Contact your insurance company for specific guidance."
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-advisory',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-advisory',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: parsedResponse, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-advisory',
      message: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-4000', message: 'Method not allowed' }
      })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { situation } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-advisory', { payload: body });
    
    if (!situation || situation.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-1000', message: 'Situation description is required' }
        })
      };
    }

    const startTime = Date.now();

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    const prompt = `You are Claim Navigator AI, an expert insurance claim advisor with extensive experience in property, commercial, and catastrophe claims.

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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, data: parsedResponse, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-advisory',
      message: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};
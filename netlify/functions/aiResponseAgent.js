const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
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

    // Handle multipart form data for file uploads
    let mode, claim, letter, document;
    let bodyData = {};
    mode = body.mode;
    claim = body.claim;
    letter = body.letter;
    document = body.document;
    bodyData = { mode, claim, hasLetter: !!letter, hasDocument: !!document };

    // Log event
    await LOG_EVENT('ai_request', 'aiResponseAgent', { payload: bodyData });

    // Validate required fields
    if ((!letter || !letter.trim()) && !document) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-1000', message: "Insurer correspondence is required" }
        })
      };
    }

    if (!mode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-1000', message: "Analysis mode is required" }
        })
      };
    }

    // Define mode-specific prompts
    const modePrompts = {
      reply: "Analyze the insurer letter and draft a professional, evidence-based reply addressing their points. Focus on factual responses and policy compliance.",
      appeal: "Review the insurer's denial and create a formal appeal citing policyholder rights, policy language, and factual support. Include legal precedents where applicable.",
      clarify: "Explain this insurer letter in clear, plain English with a summary of their reasoning and potential next steps for the policyholder.",
      negotiate: "Identify leverage points and propose negotiation counterarguments for the policyholder. Focus on policy language, coverage issues, and settlement opportunities.",
      summary: "Summarize this insurer letter and provide the top three recommended actions for the policyholder."
    };

    const startTime = Date.now();

    // Initialize OpenAI client
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-5001', message: "AI service configuration error" }
        })
      };
    }

    // Prepare the system prompt
    const systemPrompt = `You are a professional insurance claim analyst specializing in policyholder advocacy. Your role is to:

1. Analyze insurer correspondence with expertise in insurance law and policy interpretation
2. Provide accurate, legally appropriate, and clearly structured outputs
3. Focus on policyholder rights and fair claim resolution
4. Generate professional, actionable responses

Guidelines:
- Always maintain a professional tone
- Cite specific policy language when relevant
- Provide actionable next steps
- Identify potential issues or concerns
- Ensure responses are legally appropriate and fact-based
- Structure output as valid JSON with the required fields`;

    // Process uploaded document if present
    let documentText = '';
    if (document) {
      // For Netlify functions, document would be in the body
      if (typeof document === 'string') {
        documentText = document;
      } else if (document.content) {
        documentText = document.content;
      }
    }

    // Prepare the user prompt with claim information
    const claimInfo = claim ? Object.entries(claim)
      .filter(([key, value]) => value && value.trim())
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join('\n') : 'No claim information provided';

    // Combine letter text and document text
    const combinedText = documentText ? 
      `DOCUMENT CONTENT:\n${documentText}\n\nADDITIONAL TEXT:\n${letter || ''}` : 
      letter;

    const userPrompt = `
ANALYSIS MODE: ${mode.toUpperCase()}

CLAIM INFORMATION:
${claimInfo}

INSURER CORRESPONDENCE:
${combinedText}

TASK: ${modePrompts[mode]}

Please provide your analysis in the following JSON format:
{
  "analysis": "Detailed analysis and reasoning for the response",
  "issues": ["List of 3-5 key issues or concerns identified"],
  "suggestions": ["List of 3-5 actionable next steps for the policyholder"],
  "draftLetter": "Complete draft response letter ready for review and sending"
}

Ensure the draftLetter is professionally formatted and ready for use.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const responseText = completion.choices[0].message.content;

    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      // Fallback response if JSON parsing fails
      parsedResponse = {
        analysis: responseText,
        issues: ["Unable to parse structured response"],
        suggestions: ["Review the analysis manually", "Consider consulting with a claims professional"],
        draftLetter: responseText
      };
    }

    // Validate and clean the response
    const cleanedResponse = {
      analysis: parsedResponse.analysis || "Analysis completed",
      issues: Array.isArray(parsedResponse.issues) ? parsedResponse.issues : ["Analysis completed"],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : ["Review the correspondence"],
      draftLetter: parsedResponse.draftLetter || parsedResponse.analysis || "Draft response generated"
    };

    // Add metadata
    cleanedResponse.metadata = {
      mode: mode,
      timestamp: new Date().toISOString(),
      model: "gpt-4o-mini"
    };

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'aiResponseAgent',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'aiResponseAgent',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: cleanedResponse, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'aiResponseAgent',
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific error types
    if (error.code === 'insufficient_quota') {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-4001', message: "AI service quota exceeded" }
        })
      };
    }
    
    if (error.code === 'invalid_api_key') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: 'CN-5001', message: "AI service configuration error" }
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message || "AI processing failed" }
      })
    };
  }
};

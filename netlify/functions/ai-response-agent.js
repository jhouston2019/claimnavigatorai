/**
 * AI Response Agent Function
 * Generates professional response letters to insurer communications
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');

exports.handler = async (event) => {
  const headers = {
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
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
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check payment status
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
        body: JSON.stringify({ error: 'Payment required' })
      };
    }

    // Parse request
    const body = JSON.parse(event.body || '{}');
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-response-agent', { payload: body });
    
    // Validate required fields
    validateRequired(body, ['denial_letter_text']);

    const {
      claim_type = 'general',
      insurer_name = '',
      denial_letter_text,
      tone = 'professional'
    } = body;

    // Sanitize inputs
    const sanitizedText = sanitizeInput(denial_letter_text);
    const sanitizedInsurer = sanitizeInput(insurer_name);

    const startTime = Date.now();

    // Build prompts
    const systemPrompt = `You are a professional insurance claim advocate specializing in policyholder rights. Your role is to analyze insurer correspondence and draft expert response letters that are:
- Professional and legally appropriate
- Fact-based and evidence-driven
- Clear and actionable
- Respectful but firm when necessary

Guidelines:
- Cite specific policy language when relevant
- Address each point raised by the insurer
- Provide actionable next steps
- Maintain appropriate tone based on context`;

    const toneInstructions = {
      professional: 'Use a professional, cooperative tone. Focus on facts and policy compliance.',
      firm: 'Use a firm but respectful tone. Assert policyholder rights clearly.',
      escalation: 'Use a more assertive tone appropriate for escalating disputes. Reference regulatory oversight if applicable.',
      'attorney-style': 'Use a formal, legalistic tone appropriate for attorney correspondence. Cite legal precedents when relevant.'
    };

    const userPrompt = `Analyze the following insurer correspondence and draft a ${tone} response letter.

Insurer: ${sanitizedInsurer}
Claim Type: ${claim_type}
Tone: ${toneInstructions[tone] || toneInstructions.professional}

Insurer Correspondence:
${sanitizedText}

Please provide:
1. A professional subject line
2. A complete response letter body addressing all points
3. Three recommended next steps

Format your response as JSON:
{
  "subject": "Subject line here",
  "body": "Complete letter body here",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;

    // Call OpenAI
    const response = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (e) {
      // If not JSON, extract structured data
      result = {
        subject: extractSubject(response),
        body: response,
        next_steps: extractNextSteps(response)
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-response-agent',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-response-agent',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, data: result, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-response-agent',
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

/**
 * Extract subject from text
 */
function extractSubject(text) {
  const match = text.match(/subject[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'Response to Insurer Correspondence';
}

/**
 * Extract next steps from text
 */
function extractNextSteps(text) {
  const steps = [];
  const lines = text.split('\n');
  let inSteps = false;
  
  for (const line of lines) {
    if (line.match(/next steps?|recommended actions?/i)) {
      inSteps = true;
      continue;
    }
    if (inSteps && line.match(/^\d+[\.\)]\s*(.+)$/)) {
      steps.push(line.replace(/^\d+[\.\)]\s*/, '').trim());
    }
    if (steps.length >= 3) break;
  }
  
  return steps.length > 0 ? steps : [
    'Review the response with your insurance professional',
    'Submit the response via certified mail',
    'Follow up within 10 business days'
  ];
}



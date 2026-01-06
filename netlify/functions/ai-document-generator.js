/**
 * AI Document Generator Function
 * Generates documents from templates with AI customization
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
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
    const processedResponse = postProcessResponse(rawResponse, 'letter');
    const validation = validateProfessionalOutput(processedResponse, 'letter');

    if (!validation.pass) {
      console.warn('[ai-document-generator] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-document-generator', {
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
    // Validate auth
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
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-document-generator', { payload: body });
    
    const {
      template_type = 'general',
      user_inputs = {},
      document_type = 'Professional Document'
    } = body;

    // Sanitize inputs
    const sanitizedInputs = {};
    for (const [key, value] of Object.entries(user_inputs)) {
      sanitizedInputs[key] = sanitizeInput(String(value || ''));
    }

    const startTime = Date.now();

    // Build system prompt
    const systemMessage = getClaimGradeSystemMessage('letter');

    // Build user prompt
    let userPrompt = `Generate a ${document_type} document using the following information:

Template Type: ${template_type}
Document Type: ${document_type}

User Information:
${JSON.stringify(sanitizedInputs, null, 2)}

Please generate a complete, professional document that:
1. Includes all user-provided information
2. Follows the standard format for ${document_type}
3. Is ready for submission or use
4. Is properly formatted and structured

Return the document as formatted text/HTML that can be displayed and exported.`;

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'letter');

    // Call OpenAI
    const documentText = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 3000
    });

    // Extract subject line if possible
    const subjectLine = extractSubjectLine(documentText, document_type);

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      document_text: documentText,
      html: formatAsHTML(documentText),
      subject_line: subjectLine,
      template_type: template_type,
      document_type: document_type,
      generated_at: new Date().toISOString()
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-document-generator',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-document-generator',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-document-generator',
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

/**
 * Extract subject line from document
 */
function extractSubjectLine(text, documentType) {
  const subjectMatch = text.match(/subject[:\s]+(.+?)(?:\n|$)/i) || 
                       text.match(/re[:\s]+(.+?)(?:\n|$)/i);
  return subjectMatch ? subjectMatch[1].trim() : `${documentType} - ${new Date().toLocaleDateString()}`;
}

/**
 * Format text as HTML
 */
function formatAsHTML(text) {
  // Convert line breaks to <br>
  let html = text.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${html}</div>`;
}



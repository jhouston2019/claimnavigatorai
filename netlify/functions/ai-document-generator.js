/**
 * AI Document Generator Function
 * Generates documents from templates with AI customization
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');

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

    // Build system prompt
    const systemPrompt = `You are a professional document generator specializing in insurance claim documents. Your role is to create accurate, legally appropriate, and professionally formatted documents based on user inputs.

Guidelines:
- Use the exact template structure requested
- Fill in all user-provided information accurately
- Maintain professional tone and formatting
- Ensure legal compliance and accuracy
- Include all required sections
- Format for clarity and readability`;

    // Build user prompt
    const userPrompt = `Generate a ${document_type} document using the following information:

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

    // Call OpenAI
    const documentText = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 3000
    });

    // Extract subject line if possible
    const subjectLine = extractSubjectLine(documentText, document_type);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          document_text: documentText,
          html: formatAsHTML(documentText),
          subject_line: subjectLine,
          template_type: template_type,
          document_type: document_type,
          generated_at: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('AI Document Generator error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
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


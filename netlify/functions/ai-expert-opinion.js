/**
 * AI Expert Opinion Request Generator Function
 */

const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
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

    const body = JSON.parse(event.body || '{}');
    const {
      description = '',
      expertise = '',
      urgency = '',
      deadline = '',
      requirements = '',
      supporting_documents = []
    } = body;

    const systemPrompt = `You are a professional document generator specializing in expert opinion requests. Create formal, professional requests for expert analysis.`;

    const userPrompt = `Generate an expert opinion request document:

Request Description: ${sanitizeInput(description)}
Expertise Area: ${expertise || 'Not specified'}
Urgency: ${urgency || 'Standard'}
Deadline: ${deadline || 'Not specified'}
Requirements: ${sanitizeInput(requirements)}
Supporting Documents: ${supporting_documents.length} file(s)

Create a professional request document that includes:
1. Clear description of what expert opinion is needed
2. Background and context
3. Specific questions or areas of analysis
4. Timeline and urgency
5. Required deliverables
6. Professional closing

Format as a formal document.`;

    const document = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: document,
          document: document,
          expertise: expertise,
          urgency: urgency
        }
      })
    };

  } catch (error) {
    console.error('AI Expert Opinion error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};


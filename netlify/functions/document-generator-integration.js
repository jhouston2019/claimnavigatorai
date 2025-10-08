const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { 
      statusCode: 401, 
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }

  try {
    const { documentType, claimDetails, templateData } = JSON.parse(event.body || '{}');
    
    if (!documentType) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing document type' }) 
      };
    }

    // Generate document based on type
    const documentTemplates = {
      'appeal-letter': 'Generate a professional appeal letter for an insurance claim denial',
      'demand-letter': 'Generate a demand letter for insurance claim settlement',
      'response-letter': 'Generate a response letter to insurance company correspondence',
      'claim-summary': 'Generate a comprehensive claim summary document',
      'damage-assessment': 'Generate a damage assessment report'
    };

    const prompt = documentTemplates[documentType] || 'Generate a professional insurance claim document';

    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert legal document generator specializing in insurance claims. Generate professional, legally sound documents that protect policyholder rights.' 
        },
        { 
          role: 'user', 
          content: `${prompt}:\n\nClaim Details: ${claimDetails || 'Not provided'}\n\nTemplate Data: ${templateData || 'Not provided'}` 
        }
      ],
      max_tokens: 3000,
      temperature: 0.5
    });

    const generatedDocument = ai.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        document: generatedDocument,
        documentType,
        generatedAt: new Date().toISOString(),
        wordCount: generatedDocument.split(' ').length
      })
    };
  } catch (error) {
    console.error('Document generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Document generation failed' })
    };
  }
};



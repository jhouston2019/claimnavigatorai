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
    const { policyText, claimType } = JSON.parse(event.body || '{}');
    
    if (!policyText) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing policy text' }) 
      };
    }

    // Analyze policy with AI
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert insurance policy analyst. Analyze insurance policies to identify coverage, exclusions, and key terms that affect claims. Provide clear, actionable insights.' 
        },
        { 
          role: 'user', 
          content: `Analyze this insurance policy for ${claimType || 'general'} claims:\n\n${policyText}` 
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const analysis = ai.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        analysis,
        keyFindings: analysis.split('\n').filter(line => line.trim().length > 0)
      })
    };
  } catch (error) {
    console.error('Policy analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Policy analysis failed' })
    };
  }
};



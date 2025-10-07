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
    const { situation, claimType, specificQuestions } = JSON.parse(event.body || '{}');
    
    if (!situation) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing situation description' }) 
      };
    }

    // Generate AI advisory response
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert insurance claims advisor. Provide specific, actionable advice for insurance claim situations. Focus on protecting the policyholder\'s rights and maximizing claim value.' 
        },
        { 
          role: 'user', 
          content: `Provide advisory guidance for this ${claimType || 'insurance'} claim situation:\n\nSituation: ${situation}\n\nSpecific Questions: ${specificQuestions || 'General guidance needed'}` 
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const advisoryResponse = ai.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        advisoryResponse,
        recommendations: advisoryResponse.split('\n').filter(line => line.trim().length > 0),
        nextSteps: [
          "Review your insurance policy",
          "Gather supporting documentation",
          "Contact your insurance company",
          "Consider professional assistance if needed"
        ]
      })
    };
  } catch (error) {
    console.error('AI advisory error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI advisory failed' })
    };
  }
};

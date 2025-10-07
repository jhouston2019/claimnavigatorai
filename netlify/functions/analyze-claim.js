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
    const { claimDetails, damageDescription, photos } = JSON.parse(event.body || '{}');
    
    if (!claimDetails) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing claim details' }) 
      };
    }

    // Analyze claim with AI
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert insurance claims adjuster. Analyze claim details to assess damage, estimate costs, and identify potential issues. Provide professional assessment and recommendations.' 
        },
        { 
          role: 'user', 
          content: `Analyze this insurance claim:\n\nClaim Details: ${claimDetails}\n\nDamage Description: ${damageDescription || 'Not provided'}\n\nPhotos: ${photos ? 'Available' : 'Not provided'}` 
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
        assessment: {
          severity: 'moderate',
          estimatedCost: 'TBD',
          recommendations: analysis.split('\n').filter(line => line.trim().length > 0)
        }
      })
    };
  } catch (error) {
    console.error('Claim analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Claim analysis failed' })
    };
  }
};

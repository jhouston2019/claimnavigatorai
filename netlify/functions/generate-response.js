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
    const { letter } = JSON.parse(event.body || '{}');
    if (!letter) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing letter text' }) 
      };
    }

    // Check user credits
    const { data: creditRow, error: creditError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.sub)
      .single();

    if (creditError || !creditRow) {
      console.error('Credit check error:', creditError);
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: 'Failed to check credits' }) 
      };
    }

    if (creditRow.credits <= 0) {
      return { 
        statusCode: 403, 
        headers,
        body: JSON.stringify({ error: 'Insufficient credits' }) 
      };
    }

    // Generate AI response
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert insurance claims response assistant. Generate professional, legally sound responses to insurance company letters. Focus on protecting the policyholder\'s rights and maximizing their claim value. Be specific, factual, and assertive but professional.' 
        },
        { 
          role: 'user', 
          content: `Please analyze this insurance company letter and generate a professional response that protects the policyholder's interests:\n\n${letter}` 
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const response = ai.choices[0].message.content;

    // Deduct 1 credit
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        credits: creditRow.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.sub);

    if (updateError) {
      console.error('Credit update error:', updateError);
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: 'Failed to update credits' }) 
      };
    }

    console.log(`✅ AI response generated for user ${user.email}, credits remaining: ${creditRow.credits - 1}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response,
        creditsRemaining: creditRow.credits - 1
      })
    };
  } catch (error) {
    console.error('AI generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI generation failed' })
    };
  }
};
const OpenAI = require('openai');

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

  try {
    const body = JSON.parse(event.body || '{}');
    const { inputText, type = 'general' } = body;
    
    if (!inputText) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'inputText is required' }) 
      };
    }

    // Generate AI response based on type
    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'claim_response':
        systemPrompt = 'You are an expert insurance claims response assistant. Generate professional, legally sound responses to insurance company letters. Focus on protecting the policyholder\'s rights and maximizing their claim value. Be specific, factual, and assertive but professional.';
        userPrompt = `Please analyze this insurance company letter and generate a professional response that protects the policyholder's interests:\n\n${inputText}`;
        break;
      case 'damage_assessment':
        systemPrompt = 'You are an expert insurance damage assessment specialist. Analyze damage descriptions and provide professional recommendations for documentation, inspection, and claim preparation.';
        userPrompt = `Please analyze this damage description and provide professional assessment recommendations:\n\n${inputText}`;
        break;
      case 'settlement_analysis':
        systemPrompt = 'You are an expert insurance settlement analyst. Analyze settlement offers and provide professional recommendations for negotiation and claim maximization.';
        userPrompt = `Please analyze this settlement offer and provide professional analysis:\n\n${inputText}`;
        break;
      default:
        systemPrompt = 'You are an expert insurance claims assistant. Provide professional, helpful advice for insurance claim situations.';
        userPrompt = `Please provide professional advice for this insurance claim situation:\n\n${inputText}`;
    }

    // Generate AI response
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const response = ai.choices[0].message.content;

    console.log(`✅ AI response generated for type: ${type}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response,
        type,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('AI generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI generation failed: ' + error.message })
    };
  }
};

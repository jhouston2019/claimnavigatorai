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
    const { analysisType, text } = body;

    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'text is required' })
      };
    }

    // Generate analysis based on type
    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'damage_assessment':
        systemPrompt = 'You are an expert insurance damage assessment specialist. Analyze damage descriptions and provide detailed professional recommendations for documentation, inspection, and claim preparation. Format your response as a comprehensive analysis report.';
        userPrompt = `Please provide a detailed damage assessment analysis for this claim:\n\n${text}`;
        break;
      case 'estimate_comparison':
        systemPrompt = 'You are an expert insurance estimate analyst. Compare estimates and provide professional recommendations for resolving discrepancies and maximizing claim value.';
        userPrompt = `Please analyze these estimates and provide a comparison analysis:\n\n${text}`;
        break;
      case 'business_interruption':
        systemPrompt = 'You are an expert business interruption insurance specialist. Analyze business interruption claims and provide professional recommendations for documentation and calculation.';
        userPrompt = `Please analyze this business interruption claim and provide professional recommendations:\n\n${text}`;
        break;
      case 'settlement_analysis':
        systemPrompt = 'You are an expert insurance settlement analyst. Analyze settlement offers and provide professional recommendations for negotiation and claim maximization.';
        userPrompt = `Please analyze this settlement offer and provide professional analysis:\n\n${text}`;
        break;
      default:
        systemPrompt = 'You are an expert insurance claims analyst. Provide comprehensive analysis and professional recommendations for insurance claim situations.';
        userPrompt = `Please provide a comprehensive analysis for this insurance claim situation:\n\n${text}`;
    }

    // Generate AI analysis
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const analysis = ai.choices[0].message.content;

    console.log(`✅ Claim analysis generated for type: ${analysisType}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        analysis,
        assessment: analysis,
        comparison: analysis,
        report: analysis,
        type: analysisType,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Analysis failed: ' + error.message })
    };
  }
};

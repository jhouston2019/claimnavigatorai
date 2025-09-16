const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { analysisType, inputData, userEmail } = JSON.parse(event.body);

    if (!analysisType || !inputData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: analysisType, inputData' }),
      };
    }

    // Get user from auth header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // Check user credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_email', user.email)
      .single();

    if (creditsError || !credits || credits.credits < 1) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: 'Insufficient credits' }),
      };
    }

    // Generate AI analysis based on type
    let analysisPrompt = '';
    let systemPrompt = '';

    switch (analysisType) {
      case 'policy_review':
        systemPrompt = `You are an expert insurance policy analyst. Analyze the provided policy information and identify coverage gaps, limits, and recommendations.`;
        analysisPrompt = `Analyze this insurance policy information:

${inputData}

Provide a comprehensive analysis including:
1. Coverage type and limits
2. Deductible information
3. Coverage gaps identified
4. Specific recommendations for improvement
5. Potential issues or limitations

Format your response in a clear, professional manner with bullet points and specific recommendations.`;
        break;

      case 'damage_assessment':
        systemPrompt = `You are a professional property damage assessor. Analyze damage information and provide detailed assessments with cost estimates.`;
        analysisPrompt = `Analyze this property damage information:

${inputData}

Provide a comprehensive damage assessment including:
1. Property damage breakdown by category
2. Estimated repair costs
3. Depreciation analysis
4. Net claim value calculation
5. Required documentation checklist
6. Timeline estimates for repairs

Format your response with clear categories, cost breakdowns, and actionable recommendations.`;
        break;

      case 'estimate_review':
        systemPrompt = `You are an expert in construction estimates and insurance claims. Compare estimates and identify discrepancies.`;
        analysisPrompt = `Compare these construction estimates:

${inputData}

Provide a detailed comparison analysis including:
1. Side-by-side estimate comparison
2. Discrepancy identification and amounts
3. Missing items or scope differences
4. Recommended actions for resolution
5. Supporting documentation needed
6. Negotiation strategy recommendations

Format your response with clear comparisons, specific discrepancies, and actionable next steps.`;
        break;

      case 'business_interruption':
        systemPrompt = `You are a business interruption specialist. Calculate BI losses and provide comprehensive analysis.`;
        analysisPrompt = `Analyze this business interruption claim:

${inputData}

Provide a comprehensive BI analysis including:
1. Lost revenue calculation
2. Extra expenses analysis
3. Total BI claim calculation
4. Documentation requirements
5. Timeline projections
6. Supporting evidence needed

Format your response with clear calculations, supporting documentation requirements, and professional recommendations.`;
        break;

      case 'expert_opinion':
        systemPrompt = `You are a legal expert specializing in insurance claims. Generate professional expert opinion requests.`;
        analysisPrompt = `Generate an expert opinion request for this claim situation:

${inputData}

Create a professional expert opinion request letter including:
1. Proper letter format and addressing
2. Clear scope of work requested
3. Specific expertise needed
4. Document requirements
5. Timeline expectations
6. Professional language and tone

Format as a complete, ready-to-use letter with placeholders for specific details.`;
        break;

      case 'settlement_analysis':
        systemPrompt = `You are a settlement negotiation expert. Analyze settlement offers and develop negotiation strategies.`;
        analysisPrompt = `Analyze this settlement offer and develop a negotiation strategy:

${inputData}

Provide a comprehensive settlement analysis including:
1. Settlement offer evaluation
2. Shortfall calculation and analysis
3. Negotiation strategy development
4. Key arguments and supporting evidence
5. Recommended next steps
6. Timeline for negotiations

Format your response with clear analysis, specific strategies, and actionable recommendations.`;
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid analysis type' }),
        };
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: analysisPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const analysis = completion.choices[0].message.content;

    // Deduct credit
    await supabase
      .from('user_credits')
      .update({ credits: credits.credits - 1 })
      .eq('user_email', user.email);

    // Log the analysis
    await supabase
      .from('credit_log')
      .insert({
        user_email: user.email,
        mode: `ai-analysis-${analysisType}`,
        language: 'en',
        tokens_used: completion.usage.total_tokens,
        created_at: new Date().toISOString()
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: analysis,
        analysisType: analysisType,
        tokensUsed: completion.usage.total_tokens
      }),
    };

  } catch (error) {
    console.error('Analysis error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Analysis failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }),
    };
  }
};

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { module, inputs } = JSON.parse(event.body);

    if (!module || !inputs) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ ok: false, error: 'Missing module or inputs' }),
      };
    }

    let prompt = '';
    let systemPrompt = '';

    // Generate appropriate prompt based on module
    switch (module) {
      case 'policy':
        systemPrompt = `You are an expert insurance policy analyst. Analyze the provided policy text and provide a comprehensive coverage analysis.`;
        prompt = `Analyze this insurance policy text and provide a detailed coverage analysis:

Policy Text: ${inputs.text}
Policy Type: ${inputs.type}
Jurisdiction: ${inputs.jurisdiction}
Deductible: $${inputs.deductible}

Please provide:
1. **Coverage Summary** - What is covered and key coverage limits
2. **Exclusions & Limitations** - What is not covered and important limitations
3. **Ambiguities / Favorable Clauses** - Unclear language that could benefit the policyholder
4. **Recommendations** - Specific advice for maximizing coverage and protecting rights

Format your response in HTML with clear headings and bullet points.`;
        break;

      case 'damage':
        systemPrompt = `You are an expert damage assessment specialist. Analyze the damage description and provide cost estimates and coverage analysis.`;
        prompt = `Analyze this damage claim and provide a comprehensive damage assessment:

Damage Description: ${inputs.description}
Damage Types: ${inputs.types.join(', ')}

Please provide:
1. **Damage Summary** - Overview of damage categories and severity
2. **Coverage Relevance** - How each damage type relates to typical insurance coverage
3. **Required Documentation** - What evidence and documentation is needed
4. **Estimated Repair Range** - Low, Mid, and High cost estimates with reasoning

Format your response in HTML with clear headings and cost breakdowns.`;
        break;

      case 'estimates':
        systemPrompt = `You are an expert construction cost analyst. Compare and analyze contractor estimates for accuracy and completeness.`;
        prompt = `Analyze and compare these construction estimates:

Files Uploaded: ${inputs.files ? inputs.files.length : 0} files
Labor Rate: ${inputs.laborRate || 'Not specified'}
Tax Rate: ${inputs.taxPercent || 'Not specified'}
Include O&P: ${inputs.includeOverhead ? 'Yes' : 'No'}

Please provide:
1. **Comparison Table** - Side-by-side analysis of estimates
2. **Scope Gaps** - Missing items or incomplete scope
3. **Pricing Deltas** - Significant cost differences and their causes
4. **Negotiation Talking Points** - Key points for negotiating with insurer

Format your response in HTML with tables and clear recommendations.`;
        break;

      case 'bi':
        systemPrompt = `You are an expert business interruption analyst. Calculate lost income and extra expenses during business closure.`;
        prompt = `Calculate business interruption losses for this business:

Business Name: ${inputs.businessName}
Period: ${inputs.startDate} to ${inputs.endDate}
COGS %: ${inputs.cogsPercent}%
Fixed Costs: $${inputs.fixedCosts}
Extra Expenses: ${inputs.extraExpenses}

Please provide:
1. **Projected Revenue vs. Actual** - Comparison of expected vs. lost revenue
2. **Lost Profit Summary** - Detailed calculation of lost profits
3. **Extra Expense Table** - Breakdown of additional expenses
4. **Total Claimable Loss** - Final calculation with supporting documentation

Format your response in HTML with financial tables and calculations.`;
        break;

      case 'settlement':
        systemPrompt = `You are an expert settlement negotiator. Analyze settlement offers and provide negotiation strategy.`;
        prompt = `Analyze this settlement situation and provide negotiation strategy:

Offer Amount: $${inputs.offerAmount}
Your Valuation: $${inputs.yourValuation}
Disputed Categories: ${inputs.disputedCategories}
Jurisdiction: ${inputs.jurisdiction}
Days Since Claim: ${inputs.daysSinceClaim}

Please provide:
1. **Fair Value Range** - Realistic settlement range based on facts
2. **Negotiation Script** - Specific talking points and approach
3. **Counteroffer Strategy** - Recommended counteroffer amount and reasoning
4. **Leverage Points** - Key strengths and pressure points to use

Format your response in HTML with clear sections and actionable advice.`;
        break;

      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ ok: false, error: 'Invalid module specified' }),
        };
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const analysisResult = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ok: true,
        html: analysisResult,
        module: module
      }),
    };

  } catch (error) {
    console.error('Error in claim-analysis function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ok: false,
        error: 'Internal server error. Please try again later.'
      }),
    };
  }
};

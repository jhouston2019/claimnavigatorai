const OpenAI = require("openai");

exports.handler = async (event) => {
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
    const { claimText } = body;

    if (!claimText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing claimText in request body' })
      };
    }

    // Parse the claimText to get module and inputs
    let moduleId = 'generic';
    let inputs = {};
    
    try {
      const parsed = JSON.parse(claimText);
      if (parsed.module) {
        moduleId = parsed.module;
        inputs = parsed.inputs || {};
      }
    } catch (e) {
      // If not JSON, treat as plain text
      inputs = { text: claimText };
    }

    // Create specialized prompts based on module type
    let systemPrompt = 'You are an expert insurance claim analyst providing clear, structured summaries and recommendations.';
    let userPrompt = `Analyze the following insurance claim:\n${claimText}`;

    switch (moduleId) {
      case 'policy':
        systemPrompt = 'You are an expert insurance policy analyst. Analyze policy coverage, exclusions, and provide detailed recommendations.';
        userPrompt = `Analyze this insurance policy for coverage and exclusions:\n\nPolicy Type: ${inputs.type || 'Not specified'}\nJurisdiction: ${inputs.jurisdiction || 'Not specified'}\nDeductible: $${inputs.deductible || 'Not specified'}\n\nPolicy Text:\n${inputs.text || claimText}`;
        break;
        
      case 'damage':
        systemPrompt = 'You are an expert damage assessment analyst. Calculate damage costs, assess coverage, and provide detailed cost breakdowns.';
        userPrompt = `Assess this damage claim:\n\nDescription: ${inputs.description || 'Not provided'}\nDamage Types: ${inputs.types ? inputs.types.join(', ') : 'Not specified'}\n\nProvide detailed damage assessment and cost analysis.`;
        break;
        
      case 'estimates':
        systemPrompt = 'You are an expert estimate comparison analyst. Compare estimates, identify discrepancies, and provide detailed analysis.';
        userPrompt = `Compare these estimates:\n\nLabor Rate: $${inputs.laborRate || 'Not specified'}/hour\nTax: ${inputs.taxPercent || 'Not specified'}%\nInclude O&P: ${inputs.includeOverhead ? 'Yes' : 'No'}\n\nAnalyze the uploaded estimate files and provide detailed comparison.`;
        break;
        
      case 'bi':
        systemPrompt = 'You are an expert business interruption analyst. Calculate BI losses, analyze financial impact, and provide detailed calculations.';
        userPrompt = `Calculate business interruption loss:\n\nBusiness: ${inputs.businessName || 'Not specified'}\nPeriod: ${inputs.startDate || 'Not specified'} to ${inputs.endDate || 'Not specified'}\nCOGS: ${inputs.cogsPercent || 'Not specified'}%\nFixed Costs: $${inputs.fixedCosts || 'Not specified'}\nExtra Expenses: ${inputs.extraExpenses || 'None'}\n\nProvide detailed BI calculation and analysis.`;
        break;
        
      case 'settlement':
        systemPrompt = 'You are an expert settlement negotiation analyst. Evaluate settlement offers, identify shortfalls, and provide negotiation strategies.';
        userPrompt = `Analyze this settlement offer:\n\nOffer Amount: $${inputs.offerAmount || 'Not specified'}\nYour Valuation: $${inputs.yourValuation || 'Not specified'}\nDisputed Categories: ${inputs.disputedCategories || 'Not specified'}\nJurisdiction: ${inputs.jurisdiction || 'Not specified'}\nDays Since Claim: ${inputs.daysSinceClaim || 'Not specified'}\n\nProvide detailed settlement analysis and negotiation strategy.`;
        break;
    }

    // Initialize OpenAI client
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    // Generate AI analysis
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const result = completion.choices?.[0]?.message?.content || "No analysis generated.";
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        analysis: result,
        assessment: result,
        comparison: result,
        report: result
      })
    };
  } catch (err) {
    console.error('Claim analysis error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message || 'Server error'
      })
    };
  }
};
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
        systemPrompt = `You are a senior insurance policy analyst with 20+ years of experience. You specialize in comprehensive policy analysis, coverage gap identification, and strategic recommendations for maximizing claim settlements. Your analysis is relied upon by policyholders and legal professionals nationwide.`;
        analysisPrompt = `Conduct a comprehensive analysis of this insurance policy information:

${inputData}

PROVIDE A DETAILED ANALYSIS INCLUDING:

**COVERAGE ANALYSIS:**
- Policy type and coverage categories
- Coverage limits and sub-limits
- Deductible structure and amounts
- Coverage effective dates and terms

**GAP IDENTIFICATION:**
- Specific coverage gaps that could impact this claim
- Exclusions that may apply
- Coverage limitations or restrictions
- Potential coverage disputes

**STRATEGIC RECOMMENDATIONS:**
- Specific actions to maximize coverage
- Documentation requirements for full coverage
- Negotiation strategies for coverage disputes
- Timeline considerations and deadlines

**PROFESSIONAL ASSESSMENT:**
- Overall policy strength and weaknesses
- Risk factors and potential issues
- Comparative analysis with industry standards
- Actionable next steps for policyholder

Format your response with clear headings, bullet points, and specific actionable recommendations. Use professional insurance terminology and provide strategic insights that will help maximize the claim settlement.`;
        break;

      case 'damage_assessment':
        systemPrompt = `You are a certified property damage assessor with 15+ years of experience in insurance claims, construction estimating, and property valuation. You specialize in comprehensive damage assessments that maximize claim settlements and ensure accurate cost recovery.`;
        analysisPrompt = `Conduct a professional damage assessment analysis of this property damage information:

${inputData}

PROVIDE A COMPREHENSIVE DAMAGE ASSESSMENT INCLUDING:

**DAMAGE CATEGORIZATION:**
- Structural damage assessment and severity
- Contents damage inventory and valuation
- Additional living expenses (ALE) calculations
- Code upgrade requirements and costs

**COST ANALYSIS:**
- Detailed repair cost estimates by category
- Material costs with current market pricing
- Labor costs with regional adjustments
- Equipment and permit costs

**DEPRECIATION & VALUATION:**
- Actual Cash Value (ACV) calculations
- Replacement Cost Value (RCV) analysis
- Depreciation schedules and methodology
- Net claim value determination

**DOCUMENTATION REQUIREMENTS:**
- Required photos and documentation
- Professional inspection recommendations
- Expert opinion requirements
- Supporting evidence checklist

**STRATEGIC RECOMMENDATIONS:**
- Negotiation strategies for cost disputes
- Timeline for repairs and completion
- Quality control and warranty considerations
- Settlement maximization tactics

Format your response with clear sections, detailed cost breakdowns, and professional recommendations that will support a strong claim settlement.`;
        break;

      case 'estimate_review':
        systemPrompt = `You are a senior construction cost consultant and insurance claims expert with 20+ years of experience. You specialize in detailed estimate analysis, discrepancy identification, and strategic negotiation support for insurance claims. Your expertise is relied upon by policyholders, attorneys, and public adjusters nationwide.`;
        analysisPrompt = `Conduct a comprehensive estimate comparison analysis of these construction estimates:

${inputData}

PROVIDE A DETAILED COMPARISON ANALYSIS INCLUDING:

**ESTIMATE BREAKDOWN:**
- Line-by-line comparison of all estimate items
- Labor rates and material costs analysis
- Scope of work comparison and differences
- Quantity and unit cost verification

**DISCREPANCY IDENTIFICATION:**
- Specific discrepancies with dollar amounts
- Missing items or scope gaps
- Overpricing or underpricing analysis
- Code compliance and upgrade requirements

**PROFESSIONAL ASSESSMENT:**
- Market rate analysis for labor and materials
- Regional cost adjustments and considerations
- Quality and specification differences
- Timeline and scheduling impacts

**NEGOTIATION STRATEGY:**
- Key arguments for dispute resolution
- Supporting documentation requirements
- Expert opinion recommendations
- Settlement negotiation tactics

**ACTIONABLE RECOMMENDATIONS:**
- Specific steps to resolve discrepancies
- Documentation to request from insurer
- Timeline for resolution
- Escalation procedures if needed

Format your response with clear sections, specific dollar amounts, and strategic recommendations that will maximize the claim settlement.`;
        break;

      case 'business_interruption':
        systemPrompt = `You are a certified business interruption specialist and forensic accountant with 18+ years of experience. You specialize in complex BI claim calculations, lost revenue analysis, and extra expense documentation. Your expertise is used by policyholders, public adjusters, and legal professionals in high-value commercial claims.`;
        analysisPrompt = `Conduct a comprehensive business interruption analysis of this claim:

${inputData}

PROVIDE A DETAILED BI ANALYSIS INCLUDING:

**LOST REVENUE CALCULATION:**
- Historical revenue analysis and trends
- Projected revenue calculations
- Seasonal adjustments and market factors
- Mitigation efforts and their impact

**EXTRA EXPENSES ANALYSIS:**
- Temporary location costs
- Additional operating expenses
- Equipment rental and replacement costs
- Marketing and customer retention expenses

**COMPREHENSIVE BI CALCULATION:**
- Total lost revenue calculation
- Extra expenses summary
- Net business interruption claim
- Period of restoration analysis

**DOCUMENTATION REQUIREMENTS:**
- Financial records needed
- Tax returns and profit/loss statements
- Bank statements and cash flow records
- Industry comparison data

**SUPPORTING EVIDENCE:**
- Expert opinion requirements
- Industry benchmarking data
- Economic impact analysis
- Mitigation documentation

**STRATEGIC RECOMMENDATIONS:**
- Documentation organization strategy
- Expert engagement recommendations
- Negotiation approach and tactics
- Timeline for claim resolution

Format your response with clear calculations, specific dollar amounts, and professional recommendations that will maximize the BI claim settlement.`;
        break;

      case 'expert_opinion':
        systemPrompt = `You are a senior insurance claims attorney and expert witness coordinator with 25+ years of experience. You specialize in drafting professional expert opinion requests that secure the most qualified experts and maximize their impact on claim settlements. Your letters are used by policyholders, public adjusters, and legal professionals nationwide.`;
        analysisPrompt = `Draft a comprehensive expert opinion request letter for this claim situation:

${inputData}

CREATE A PROFESSIONAL EXPERT OPINION REQUEST INCLUDING:

**LETTER FORMAT:**
- Professional letterhead and addressing
- Clear subject line with claim reference
- Proper salutation and professional tone
- Formal closing and signature block

**SCOPE OF WORK:**
- Detailed description of expertise needed
- Specific areas of investigation required
- Scope limitations and boundaries
- Deliverable expectations and format

**EXPERT QUALIFICATIONS:**
- Required credentials and certifications
- Minimum experience requirements
- Industry specialization needs
- Geographic and jurisdictional considerations

**DOCUMENTATION REQUIREMENTS:**
- Complete document package needed
- Site inspection requirements
- Interview and consultation needs
- Supporting evidence requirements

**TIMELINE AND DELIVERABLES:**
- Specific deadline requirements
- Milestone and progress reporting
- Final report format and content
- Expert testimony preparation if needed

**PROFESSIONAL STANDARDS:**
- Ethical requirements and standards
- Confidentiality and privilege considerations
- Quality assurance expectations
- Peer review and validation process

Format as a complete, ready-to-use professional letter that will secure the most qualified expert and maximize the impact on the claim settlement.`;
        break;

      case 'settlement_analysis':
        systemPrompt = `You are a senior settlement negotiation specialist and insurance claims strategist with 22+ years of experience. You specialize in complex settlement analysis, negotiation strategy development, and maximizing claim recoveries. Your expertise is relied upon by policyholders, public adjusters, and legal professionals in high-value insurance disputes.`;
        analysisPrompt = `Conduct a comprehensive settlement analysis and develop a strategic negotiation plan for this settlement offer:

${inputData}

PROVIDE A DETAILED SETTLEMENT ANALYSIS INCLUDING:

**SETTLEMENT EVALUATION:**
- Comprehensive offer analysis and breakdown
- Coverage adequacy assessment
- Market comparison and benchmarking
- Industry standard evaluation

**SHORTFALL CALCULATION:**
- Detailed shortfall analysis by category
- Specific dollar amounts and percentages
- Coverage gaps and limitations
- Additional damages not included

**NEGOTIATION STRATEGY:**
- Multi-phase negotiation approach
- Key leverage points and arguments
- Supporting evidence and documentation
- Escalation and alternative dispute resolution options

**STRATEGIC POSITIONING:**
- Strongest arguments for increased settlement
- Weaknesses in insurer's position
- Legal precedents and case law support
- Expert opinion and professional support

**ACTIONABLE RECOMMENDATIONS:**
- Specific next steps and timeline
- Documentation to prepare and submit
- Expert engagement recommendations
- Communication strategy and approach

**RISK ASSESSMENT:**
- Potential negotiation outcomes
- Timeline considerations and deadlines
- Alternative resolution options
- Cost-benefit analysis of continued negotiations

Format your response with clear sections, specific dollar amounts, and strategic recommendations that will maximize the final settlement amount.`;
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

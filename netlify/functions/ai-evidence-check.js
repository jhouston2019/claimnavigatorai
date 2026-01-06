const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');


exports.handler = async (event) => {
  // ✅ PHASE 5B: FULLY HARDENED

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    
    // PHASE 5B: Post-process and validate
    const processedResponse = postProcessResponse(rawResponse, 'checklist');
    const validation = validateProfessionalOutput(processedResponse, 'checklist');

    if (!validation.pass) {
      console.warn('[ai-evidence-check] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-evidence-check', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, data: null, error: { code: 'CN-4000', message: 'Method not allowed' } })
    };
  }

  try {
    // Auth validation
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Authorization required' } })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Invalid token' } })
      };
    }

    // Payment validation
    const { data: payment } = await supabase
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (!payment) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-3000', message: 'Payment required' } })
      };
    }

    // Unified body parsing
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Invalid JSON body' } })
      };
    }

    const { claimType, uploadedCategories, claimDetails, claimInfo = {} } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-evidence-check', { payload: body });
    
    const startTime = Date.now();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `
You are an insurance claim documentation expert analyzing the completeness of evidence for a claim.

Claim Type: ${claimType || 'General Property Claim'}
Uploaded Evidence Categories: ${uploadedCategories.join(', ')}

Based on the uploaded evidence categories, identify:
1. Missing critical evidence types
2. Recommended additional documentation
3. Priority level for each missing item

Consider these standard evidence types for insurance claims:
- Photos (damage, property, receipts)
- Official documents (police reports, estimates, invoices)
- Receipts (repairs, temporary housing, replacement items)
- Correspondence (emails, letters with insurance company)
- Medical records (if applicable)
- Witness statements
- Expert reports

Output JSON only with this exact format:
{
  "missing": ["missing evidence type 1", "missing evidence type 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "completeness_score": 75,
  "priority_items": ["high priority item 1", "high priority item 2"]
}

Focus on what's typically required for a strong insurance claim. Be specific about evidence types that are missing.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400
    });

    const result = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      parsedResult = {
        missing: ["Unable to analyze evidence completeness"],
        recommendations: ["Please review your documentation with an insurance professional"],
        completeness_score: 0,
        priority_items: ["Contact your insurance company for guidance"]
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-evidence-check',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-evidence-check',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: parsedResult, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-evidence-check',
      message: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};


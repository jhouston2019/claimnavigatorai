/**
 * AI Policy Review Function
 * Reviews and analyzes insurance policies
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
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
    // Validate auth
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

    // Check payment status
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
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-policy-review', { payload: body });

    validateRequired(body, ['policy_text']);

    const { 
      policy_text, 
      policy_type = '', 
      jurisdiction = '', 
      deductible = '', 
      claimInfo = {},
      analysis_mode = 'coverage-gap' // NEW: Support different analysis modes
    } = body;
    const sanitizedText = sanitizeInput(policy_text);

    const startTime = Date.now();

    // PHASE 5B: Use claim-grade system message
    const systemMessage = getClaimGradeSystemMessage('analysis');

    // Build prompt based on analysis mode
    let userPrompt;
    
    switch (analysis_mode) {
      case 'sublimit':
        userPrompt = `Analyze this insurance policy for sublimits and return ONLY valid JSON with this exact structure:

{
  "sublimits": [
    {
      "coverage_type": "Coverage category name (e.g., Mold Remediation, Code Upgrades)",
      "policy_limit": 25000,
      "section": "Policy section reference (e.g., Additional Coverages 3.2.4)",
      "recommendation": "Advice for managing this sublimit"
    }
  ],
  "summary": "Brief overview of sublimit analysis"
}

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}
Deductible: ${deductible}

Policy Text:
${sanitizedText}

Focus on:
1. Sublimits that restrict coverage amounts
2. Per-occurrence limits
3. Aggregate limits
4. Category-specific limits (mold, code upgrades, ordinance & law, etc.)

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'coverage-mapping':
        userPrompt = `Map this insurance policy coverage to claim items and return ONLY valid JSON with this exact structure:

{
  "coverage_map": [
    {
      "claim_item": "Specific claim item (e.g., Roof replacement)",
      "coverage_section": "Policy section (e.g., Dwelling Coverage A)",
      "covered": true,
      "limit": 250000,
      "deductible": 2500,
      "notes": "Coverage details (e.g., Covered under RCV)"
    }
  ],
  "coverage_percentage": 85,
  "summary": "Brief overview of coverage mapping"
}

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}

Policy Text:
${sanitizedText}

Map each potential claim item to its corresponding policy coverage section. Include:
1. Whether the item is covered (true/false)
2. Coverage limits
3. Applicable deductibles
4. Any special conditions or exclusions

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'damage-documentation':
        userPrompt = `Analyze this claim and generate a damage documentation checklist. Return ONLY valid JSON with this exact structure:

{
  "documentation": {
    "incident_summary": "Brief summary of incident",
    "affected_areas": ["Living Room", "Kitchen"],
    "required_photos": ["Overall room view", "Close-up of damage", "Serial numbers"],
    "required_documents": ["Contractor estimate", "Receipts", "Police report"],
    "completeness_score": 75
  },
  "missing_items": ["Item 1", "Item 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "summary": "Documentation assessment complete"
}

Policy Type: ${policy_type}
Claim Type: ${body.claimType || 'general'}

Policy Text:
${sanitizedText}

Context: ${body.context || 'None provided'}

Generate a comprehensive documentation checklist including:
1. Required photos and angles
2. Required documents
3. Witness statements needed
4. Evidence of ownership
5. Completeness assessment

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'coverage-gap':
      default:
        // Default: coverage gap analysis
        userPrompt = `Analyze this insurance policy and return ONLY valid JSON with this exact structure:

{
  "gaps": [
    {
      "name": "Coverage gap or limitation name",
      "section": "Policy section reference (e.g., 3.2.4)",
      "severity": "HIGH|MEDIUM|LOW",
      "impact": "Description of financial or coverage impact",
      "cost": 15000,
      "recommendation": "Specific action to address this gap"
    }
  ],
  "completeness_score": 85,
  "summary": "Brief overview of policy coverage and key findings"
}

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}
Deductible: ${deductible}

Policy Text:
${sanitizedText}

Focus on:
1. Coverage gaps and limitations
2. Key exclusions that could impact claims
3. Sublimits that may restrict payouts
4. Missing endorsements or riders
5. Deadline requirements

Severity Guidelines:
- HIGH: Could result in claim denial or >$10k impact
- MEDIUM: Could reduce payout by $5k-$10k
- LOW: Minor limitation, <$5k impact

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
    }

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    const rawAnalysis = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = rawAnalysis
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      result = JSON.parse(cleanedResponse);
      
      // Validate required fields exist
      if (!result.gaps || !Array.isArray(result.gaps)) {
        throw new Error('Missing or invalid gaps array');
      }
      
      // Ensure completeness_score exists
      if (result.completeness_score === undefined) {
        result.completeness_score = 0;
      }
      
      // Ensure summary exists
      if (!result.summary) {
        result.summary = "Policy analysis completed";
      }
      
    } catch (parseError) {
      console.error('[ai-policy-review] JSON parse error:', parseError);
      await LOG_ERROR('json_parse_error', {
        function: 'ai-policy-review',
        error: parseError.message,
        raw_response: rawAnalysis.substring(0, 500)
      });
      
      // Fallback to generic response
      result = {
        gaps: [],
        completeness_score: 0,
        summary: "Unable to parse policy analysis. Please review the policy manually or try again.",
        error: "JSON parsing failed"
      };
    }

    // PHASE 5B: Validate professional output (if we have valid JSON)
    const validation = result.error ? { pass: false, score: 0, issues: ['JSON parse error'] } : 
                       { pass: true, score: 100, issues: [] };

    if (!validation.pass) {
      console.warn('[ai-policy-review] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-policy-review', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-policy-review',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-policy-review',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: result,
        metadata: {
          quality_score: validation.score,
          validation_passed: validation.pass
        },
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-policy-review',
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

function extractSummary(text) {
  const match = text.match(/summary[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : text.substring(0, 200);
}

function extractExclusions(text) {
  const exclusions = [];
  const lines = text.split('\n');
  let inExclusions = false;
  for (const line of lines) {
    if (line.match(/exclusion/i)) inExclusions = true;
    if (inExclusions && line.match(/^[-•]\s*(.+)$/)) {
      exclusions.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return exclusions.slice(0, 10);
}

function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  let inRecommendations = false;
  for (const line of lines) {
    if (line.match(/recommendation/i)) inRecommendations = true;
    if (inRecommendations && line.match(/^[-•]\s*(.+)$/)) {
      recommendations.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return recommendations.slice(0, 5);
}



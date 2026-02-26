/**
 * AI Policy Review Function - FREE VERSION (Lead Magnet)
 * Basic policy gap analysis for landing page
 * No payment required, email capture, 1 per email limit
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE } = require('./_utils');
const { isDisposableEmail } = require('./lib/disposable-email-domains');

// Abuse detection logging helper
async function logAbuse(supabase, eventType, severity, details) {
  try {
    await supabase.from('abuse_detection_log').insert({
      event_type: eventType,
      severity: severity,
      client_ip: details.client_ip,
      email: details.email,
      user_agent: details.user_agent,
      recaptcha_score: details.recaptcha_score,
      request_count: details.request_count,
      details: details.extra || {}
    });
    console.log(`[ABUSE] Logged: ${eventType} (${severity}) - IP: ${details.client_ip}`);
  } catch (error) {
    console.error('[ABUSE] Failed to log:', error);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, data: null, error: { code: 'FREE-4000', message: 'Method not allowed' } })
    };
  }

  try {
    // Parse body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'FREE-1000', message: 'Invalid JSON body' } })
      };
    }
    
    // Validate required fields
    validateRequired(body, ['policy_text', 'email', 'recaptcha_token']);

    const { 
      policy_text, 
      email,
      policy_type = 'Homeowner', 
      jurisdiction = 'Not specified',
      recaptcha_token
    } = body;

    // SECURITY: Verify reCAPTCHA token
    try {
      const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`
      });

      const recaptchaData = await recaptchaResponse.json();

      if (!recaptchaData.success || recaptchaData.score < 0.5) {
        // Log abuse attempt
        await logAbuse(supabase, 'recaptcha_fail', 'HIGH', {
          client_ip: clientIP,
          email: email,
          user_agent: event.headers['user-agent'],
          recaptcha_score: recaptchaData.score,
          extra: { action: recaptchaData.action }
        });

        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ 
            success: false, 
            data: null, 
            error: { 
              code: 'FREE-4002', 
              message: 'reCAPTCHA verification failed. Please try again or contact support if this persists.',
              recaptcha_score: recaptchaData.score
            } 
          })
        };
      }

      // Log reCAPTCHA score for monitoring
      console.log(`[reCAPTCHA] Score: ${recaptchaData.score}, Action: ${recaptchaData.action}`);
    } catch (recaptchaError) {
      console.error('[reCAPTCHA] Verification error:', recaptchaError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-5001', 
            message: 'Security verification failed. Please try again.'
          } 
        })
      };
    }

    // SECURITY: File size limit (prevent cost attacks)
    if (policy_text.length > 50000) { // ~50KB limit
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-1002', 
            message: 'Policy text too large. Maximum 50,000 characters. For large policies, upgrade to Claim Command Pro.',
            upgrade_url: '/app/pricing.html'
          } 
        })
      };
    }

    // SECURITY: Basic IP rate limiting (10 per hour per IP)
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentRequests, error: rateLimitError } = await supabase
      .from('free_policy_reviews')
      .select('id')
      .gte('created_at', oneHourAgo)
      .eq('client_ip', clientIP);

    if (recentRequests && recentRequests.length >= 10) {
      // Log rate limit abuse
      await logAbuse(supabase, 'rate_limit', 'MEDIUM', {
        client_ip: clientIP,
        email: email,
        user_agent: event.headers['user-agent'],
        request_count: recentRequests.length
      });

      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-4001', 
            message: 'Rate limit exceeded. Maximum 10 requests per hour. Upgrade to Claim Command Pro for unlimited access.',
            upgrade_url: '/app/pricing.html'
          } 
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'FREE-1001', message: 'Invalid email format' } })
      };
    }

    // SECURITY: Block disposable email addresses
    if (isDisposableEmail(email)) {
      // Log disposable email attempt
      await logAbuse(supabase, 'disposable_email', 'HIGH', {
        client_ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown',
        email: email,
        user_agent: event.headers['user-agent']
      });

      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-4003', 
            message: 'Temporary or disposable email addresses are not permitted. Please use a permanent email address or upgrade to Claim Command Pro.',
            upgrade_url: '/app/pricing.html'
          } 
        })
      };
    }

    // Check if email has already used free analysis (1 per email limit)
    const { data: existingUsage, error: usageError } = await supabase
      .from('free_policy_reviews')
      .select('id, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUsage) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-3001', 
            message: 'You have already used your free policy analysis. Upgrade to Claim Command Pro for unlimited reviews and advanced features.',
            upgrade_url: '/app/pricing.html'
          } 
        })
      };
    }

    const sanitizedText = sanitizeInput(policy_text);
    const startTime = Date.now();

    // SECURITY: Check daily OpenAI budget limit (hard cap: $10/day for free tier)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const DAILY_BUDGET_LIMIT = 10.00; // $10 USD
    const ESTIMATED_COST_PER_REQUEST = 0.001; // $0.001 per request (GPT-4o-mini)

    const { data: todayUsage, error: usageError } = await supabase
      .from('free_policy_reviews')
      .select('id')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    const todayCost = (todayUsage?.length || 0) * ESTIMATED_COST_PER_REQUEST;

    if (todayCost >= DAILY_BUDGET_LIMIT) {
      console.error(`[BUDGET] Daily limit reached: $${todayCost.toFixed(2)} / $${DAILY_BUDGET_LIMIT}`);
      
      // Log budget exceeded
      await logAbuse(supabase, 'budget_exceeded', 'CRITICAL', {
        client_ip: clientIP,
        email: email,
        user_agent: event.headers['user-agent'],
        extra: { cost: todayCost, limit: DAILY_BUDGET_LIMIT }
      });

      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-5003', 
            message: 'Daily free analysis limit reached. Please try again tomorrow or upgrade to Claim Command Pro for unlimited access.',
            upgrade_url: '/app/pricing.html',
            retry_after: 'tomorrow'
          } 
        })
      };
    }

    console.log(`[BUDGET] Today's usage: $${todayCost.toFixed(2)} / $${DAILY_BUDGET_LIMIT} (${todayUsage?.length || 0} requests)`);

    // SECURITY: 24-hour global request cap (hard limit: 1000 requests/day)
    const GLOBAL_DAILY_CAP = 1000;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: last24hRequests, error: capError } = await supabase
      .from('free_policy_reviews')
      .select('id')
      .gte('created_at', twentyFourHoursAgo);

    const requestCount = last24hRequests?.length || 0;

    if (requestCount >= GLOBAL_DAILY_CAP) {
      console.error(`[GLOBAL CAP] 24-hour limit reached: ${requestCount} / ${GLOBAL_DAILY_CAP}`);
      
      // Log global cap reached
      await logAbuse(supabase, 'global_cap_exceeded', 'CRITICAL', {
        client_ip: clientIP,
        email: email,
        user_agent: event.headers['user-agent'],
        request_count: requestCount
      });

      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          success: false, 
          data: null, 
          error: { 
            code: 'FREE-5004', 
            message: 'System capacity reached. Please try again in a few hours or upgrade to Claim Command Pro for priority access.',
            upgrade_url: '/app/pricing.html',
            retry_after: '4 hours'
          } 
        })
      };
    }

    console.log(`[GLOBAL CAP] 24h requests: ${requestCount} / ${GLOBAL_DAILY_CAP}`);

    // Log event
    await LOG_EVENT('free_policy_review', 'ai-policy-review-free', { 
      email: email.toLowerCase(),
      policy_type,
      jurisdiction 
    });

    // System message for free version (basic analysis only)
    const systemMessage = {
      role: 'system',
      content: `You are a professional insurance policy analyst providing a FREE basic policy review.

CRITICAL INSTRUCTIONS:
1. Provide a HIGH-LEVEL summary only (not detailed extraction)
2. Identify 3-5 major coverage gaps or concerns
3. Keep it concise and actionable
4. Focus on common issues that would motivate upgrade
5. Return ONLY valid JSON with the exact structure specified

This is a lead generation tool. Be helpful but make it clear that detailed analysis requires the premium tool.`
    };

    // User prompt for basic analysis with MONEY FRAMING
    const userPrompt = `Analyze this insurance policy and return ONLY valid JSON with this exact structure:

{
  "summary": "2-3 sentence overview of policy coverage",
  "coverage_highlights": [
    "Key coverage 1",
    "Key coverage 2",
    "Key coverage 3"
  ],
  "gaps": [
    {
      "name": "Coverage gap name",
      "severity": "HIGH|MEDIUM|LOW",
      "impact": "Brief description of impact",
      "estimated_risk": 15000,
      "recommendation": "What to do about it"
    }
  ],
  "risk_category": "MODERATE|SIGNIFICANT|SEVERE",
  "risk_explanation": "Brief explanation of how these gaps could impact a claim (NO DOLLAR AMOUNTS)",
  "upgrade_message": "Brief message about what premium analysis would reveal"
}

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}

Policy Text:
${sanitizedText}

Focus on:
1. Major coverage gaps that could impact claims
2. Missing endorsements
3. Sublimits that may restrict payouts
4. Settlement type concerns (ACV vs RCV)

CRITICAL: Categorize overall risk level as MODERATE, SIGNIFICANT, or SEVERE based on gap severity.
DO NOT provide specific dollar amounts - use qualitative descriptions only.

Risk categories:
- MODERATE: Minor gaps, likely manageable
- SIGNIFICANT: Multiple gaps that could substantially reduce payouts
- SEVERE: Critical gaps that could result in major claim denials or five-figure underpayment

For risk_explanation, use language like:
"Policies with similar structural gaps often result in substantial claim underpayment"
"These gaps could expose you to significant out-of-pocket costs"

NEVER fabricate specific dollar ranges.

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;

    const rawAnalysis = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o-mini', // Use cheaper model for free tier
      temperature: 0.7,
      max_tokens: 1000 // Limit tokens for free tier
    });

    // Parse JSON response
    let result;
    try {
      const cleanedResponse = rawAnalysis
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      result = JSON.parse(cleanedResponse);
      
      // Validate required fields
      if (!result.gaps || !Array.isArray(result.gaps)) {
        throw new Error('Missing or invalid gaps array');
      }
      
      // Ensure required fields exist
      if (!result.summary) {
        result.summary = "Basic policy analysis completed";
      }
      
      if (!result.coverage_highlights) {
        result.coverage_highlights = [];
      }

      if (!result.upgrade_message) {
        result.upgrade_message = "Upgrade to Claim Command Pro for detailed 30+ field extraction, policy trigger analysis, and coinsurance validation.";
      }
      
    } catch (parseError) {
      console.error('[ai-policy-review-free] JSON parse error:', parseError);
      await LOG_ERROR('json_parse_error', {
        function: 'ai-policy-review-free',
        error: parseError.message,
        raw_response: rawAnalysis.substring(0, 500)
      });
      
      // Fallback to generic response
      result = {
        summary: "Unable to parse policy analysis. Please ensure your policy text is clear and complete.",
        coverage_highlights: [],
        gaps: [],
        upgrade_message: "For professional-grade analysis, upgrade to Claim Command Pro.",
        error: "JSON parsing failed"
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Record usage in database (for 1-per-email limit)
    const { error: insertError } = await supabase
      .from('free_policy_reviews')
      .insert({
        email: email.toLowerCase(),
        client_ip: clientIP,
        policy_type,
        jurisdiction,
        analysis_result: result,
        duration_ms: durationMs
      });

    if (insertError) {
      console.error('[ai-policy-review-free] Failed to record usage:', insertError);
      // Don't fail the request, just log it
    }

    // Log usage
    await LOG_USAGE({
      function: 'ai-policy-review-free',
      duration_ms: durationMs,
      email: email.toLowerCase(),
      success: true
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: {
          ...result,
          free_tier: true,
          upgrade_cta: {
            title: "Unlock Advanced Policy Intelligence",
            message: "Get 30+ field extraction, policy trigger analysis, coinsurance validation, and integration with estimate comparison.",
            url: "/app/pricing.html",
            features: [
              "Form-aware detection (HO, DP, CP, BOP)",
              "30+ structured field extraction",
              "Policy trigger engine (10 trigger types)",
              "Coinsurance validation",
              "Cross-reference with estimates",
              "Actionable recommendations with recovery estimates"
            ]
          }
        },
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-policy-review-free',
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'FREE-5000', message: error.message }
      })
    };
  }
};

/**
 * AI Timeline Analyzer Function
 * Analyzes documents and key dates to suggest deadlines
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
// ⚠️ PHASE 5B: PROMPT HARDENING REQUIRED
// This function needs manual review to:
// 1. Replace system prompt with getClaimGradeSystemMessage(outputType)
// 2. Enhance user prompt with enhancePromptWithContext(prompt, claimInfo, outputType)
// 3. Post-process response with postProcessResponse(response, outputType)
// 4. Validate with validateProfessionalOutput(response, outputType)
// See: /netlify/functions/PROMPT_HARDENING_GUIDE.md

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
    await LOG_EVENT('ai_request', 'ai-timeline-analyzer', { payload: body });
    
    const {
      document_text = '',
      key_dates = {}
    } = body;

    if (!document_text.trim() && !key_dates.date_of_loss) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Document text or key dates required' } })
      };
    }

    // Sanitize inputs
    const sanitizedText = sanitizeInput(document_text);
    const sanitizedDates = {};
    for (const [key, value] of Object.entries(key_dates)) {
      if (value) sanitizedDates[key] = sanitizeInput(String(value));
    }

    const startTime = Date.now();

    // Build system prompt
    const systemPrompt = `You are an expert insurance claim analyst specializing in deadline identification and timeline analysis. Your role is to:
1. Analyze documents for critical deadlines
2. Calculate deadlines based on key dates and state regulations
3. Identify potential bad faith windows (generic language only)
4. Suggest important deadlines that may be missed

Guidelines:
- Focus on proof of loss deadlines, appeal deadlines, appraisal deadlines
- Consider state-specific regulations when dates are provided
- Use generic language for legal advice
- Prioritize deadlines by urgency
- Provide clear, actionable deadline information`;

    // Build user prompt
    const datesInfo = Object.entries(sanitizedDates)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
      .join('\n');

    const userPrompt = `Analyze the following information and suggest critical deadlines:

${datesInfo ? `Key Dates:\n${datesInfo}\n\n` : ''}${sanitizedText ? `Document Text:\n${sanitizedText}\n\n` : ''}

Please identify and suggest deadlines. For each deadline, provide:
1. Label (e.g., "Proof of Loss Due", "Appeal Deadline")
2. Date (calculate from key dates if provided)
3. Source (e.g., "State Law", "Policy", "Document", "AI Suggested")
4. Priority (high if within 7 days, medium if within 30 days, low otherwise)

Return as JSON array:
[
  {
    "label": "Deadline name",
    "date": "YYYY-MM-DD",
    "source": "Source",
    "priority": "high|medium|low"
  }
]`;

    // Call OpenAI
    const response = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let suggestedDeadlines = [];
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        suggestedDeadlines = parsed;
      } else if (parsed.deadlines) {
        suggestedDeadlines = parsed.deadlines;
      } else if (parsed.suggested_deadlines) {
        suggestedDeadlines = parsed.suggested_deadlines;
      }
    } catch (e) {
      // Extract deadlines from text if not JSON
      suggestedDeadlines = extractDeadlinesFromText(response);
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      suggested_deadlines: suggestedDeadlines,
      analyzed_at: new Date().toISOString()
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-timeline-analyzer',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-timeline-analyzer',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-timeline-analyzer',
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

/**
 * Extract deadlines from text response
 */
function extractDeadlinesFromText(text) {
  const deadlines = [];
  const lines = text.split('\n');
  
  let currentDeadline = null;
  for (const line of lines) {
    if (line.match(/deadline|due date|must.*by/i)) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
      const labelMatch = line.match(/(proof of loss|appeal|appraisal|deadline|due)/i);
      
      if (dateMatch || labelMatch) {
        deadlines.push({
          label: labelMatch ? labelMatch[0] : 'Important Deadline',
          date: dateMatch ? dateMatch[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          source: 'AI Suggested',
          priority: 'medium'
        });
      }
    }
  }

  return deadlines.slice(0, 10); // Limit to 10
}



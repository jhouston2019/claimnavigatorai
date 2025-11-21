/**
 * AI Coverage Decoder Function
 * Analyzes policy text and extracts coverage information
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
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
        body: JSON.stringify({ error: 'Invalid token' })
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
        body: JSON.stringify({ error: 'Payment required' })
      };
    }

    // Parse request
    const body = JSON.parse(event.body || '{}');
    
    validateRequired(body, ['policy_text']);

    const {
      policy_text,
      policy_type = '',
      jurisdiction = '',
      deductible = ''
    } = body;

    // Sanitize inputs
    const sanitizedText = sanitizeInput(policy_text);

    // Build system prompt
    const systemPrompt = `You are an expert insurance policy analyst. Your role is to analyze policy text and extract:
1. Coverage summary
2. Coverage limits
3. Deductibles
4. Exclusions
5. Important deadlines

Provide clear, accurate, and actionable information.`;

    // Build user prompt
    const userPrompt = `Analyze this insurance policy text and extract coverage information:

Policy Type: ${policy_type || 'Not specified'}
Jurisdiction: ${jurisdiction || 'Not specified'}
Deductible: ${deductible || 'Not specified'}

Policy Text:
${sanitizedText}

Return JSON:
{
  "summary": "Brief coverage summary",
  "limits": {
    "Dwelling": "$X",
    "Personal Property": "$X",
    "Loss of Use": "$X"
  },
  "deductibles": "Deductible information",
  "exclusions": ["Exclusion 1", "Exclusion 2"],
  "deadlines": ["Deadline 1", "Deadline 2"]
}`;

    // Call OpenAI
    const response = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (e) {
      // Extract structured data from text
      result = {
        summary: extractSummary(response),
        limits: extractLimits(response),
        deductibles: extractDeductibles(response),
        exclusions: extractExclusions(response),
        deadlines: extractDeadlines(response)
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };

  } catch (error) {
    console.error('AI Coverage Decoder error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function extractSummary(text) {
  const match = text.match(/summary[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'Coverage analysis complete';
}

function extractLimits(text) {
  const limits = {};
  const limitMatches = text.matchAll(/(\w+)\s*[:\s]+\$?([\d,]+)/gi);
  for (const match of limitMatches) {
    limits[match[1]] = `$${match[2]}`;
  }
  return limits;
}

function extractDeductibles(text) {
  const match = text.match(/deductible[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'Deductible information not found';
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

function extractDeadlines(text) {
  const deadlines = [];
  const deadlineMatches = text.matchAll(/(\d+\s+days?|deadline|due\s+date)/gi);
  for (const match of deadlineMatches) {
    deadlines.push(match[0]);
  }
  return deadlines.slice(0, 5);
}


/**
 * AI Evidence Auto-Tagger Function
 * Automatically categorizes evidence items
 */

const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
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
    const processedResponse = postProcessResponse(rawResponse, 'analysis');
    const validation = validateProfessionalOutput(processedResponse, 'analysis');

    if (!validation.pass) {
      console.warn('[ai-evidence-auto-tagger] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-evidence-auto-tagger', {
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
    await LOG_EVENT('ai_request', 'ai-evidence-auto-tagger', { payload: body });
    
    const { evidence_items = [], claimInfo = {} } = body;

    if (evidence_items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'No evidence items provided' } })
      };
    }

    const startTime = Date.now();

    // Build system prompt
    const systemMessage = getClaimGradeSystemMessage('analysis');

    // Build user prompt
    const fileList = evidence_items.map((item, index) => 
      `${index + 1}. ${item.file_name} (current: ${item.current_category || 'uncategorized'})`
    ).join('\n');

    let userPrompt = `Categorize these evidence files:

${fileList}

Return JSON array:
[
  {"file_name": "filename1.pdf", "category": "document"},
  {"file_name": "filename2.jpg", "category": "photo"},
  ...
]`;

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    // Call OpenAI
    const processedResponse = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 1000
    });

    // Parse response
    let categorizedItems = [];
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        categorizedItems = parsed;
      }
    } catch (e) {
      // Extract from text
      evidence_items.forEach(item => {
        const category = inferCategoryFromFileName(item.file_name);
        categorizedItems.push({
          file_name: item.file_name,
          category: category
        });
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      categorized_items: categorizedItems
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-evidence-auto-tagger',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-evidence-auto-tagger',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-evidence-auto-tagger',
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
 * Infer category from filename
 */
function inferCategoryFromFileName(filename) {
  const lower = filename.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|heic)$/)) return 'photo';
  if (lower.match(/estimate|quote|bid/)) return 'estimate';
  if (lower.match(/invoice|bill/)) return 'invoice';
  if (lower.match(/receipt/)) return 'receipt';
  if (lower.match(/email|\.eml$/)) return 'email';
  if (lower.match(/\.(pdf|doc|docx)$/)) return 'document';
  return 'other';
}



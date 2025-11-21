/**
 * AI Evidence Auto-Tagger Function
 * Automatically categorizes evidence items
 */

const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
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
    const { evidence_items = [] } = body;

    if (evidence_items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No evidence items provided' })
      };
    }

    // Build system prompt
    const systemPrompt = `You are an evidence categorization expert. Categorize insurance claim evidence files into appropriate categories based on file names and context.

Categories:
- photo: Photographs, images, visual documentation
- estimate: Contractor estimates, repair quotes
- invoice: Invoices, bills, receipts for expenses
- receipt: Receipts, payment confirmations
- document: Official documents, letters, policies
- email: Email correspondence
- other: Anything that doesn't fit above categories

Return JSON array with category for each file.`;

    // Build user prompt
    const fileList = evidence_items.map((item, index) => 
      `${index + 1}. ${item.file_name} (current: ${item.current_category || 'uncategorized'})`
    ).join('\n');

    const userPrompt = `Categorize these evidence files:

${fileList}

Return JSON array:
[
  {"file_name": "filename1.pdf", "category": "document"},
  {"file_name": "filename2.jpg", "category": "photo"},
  ...
]`;

    // Call OpenAI
    const response = await runOpenAI(systemPrompt, userPrompt, {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          categorized_items: categorizedItems
        }
      })
    };

  } catch (error) {
    console.error('AI Evidence Auto-Tagger error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
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


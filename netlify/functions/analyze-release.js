/**
 * Netlify Function: analyze-release
 * Analyzes release documents to identify problematic clauses
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: { message: 'Method not allowed' } })
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: { message: 'Unauthorized' } })
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { claim_id, release_pdf_url, document_id } = JSON.parse(event.body);

    if (!claim_id || !release_pdf_url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: 'Missing required fields' } })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // TODO: Implement AI release analysis using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Download release PDF
    // 2. Extract text from document
    // 3. Call Claude API with release analysis prompt
    // 4. Identify problematic clauses and waived rights
    // 5. Generate recommendations

    const mockReleaseAnalysis = {
      release_type: 'partial',
      problematic_clauses: [
        {
          clause_text: 'Releases all claims arising from or related to the property',
          severity: 'high',
          issue: 'Overly broad language that may waive future claims unrelated to this loss',
          recommendation: 'Request revision to limit release to "claims arising from the loss on [date of loss]"'
        },
        {
          clause_text: 'Waives right to pursue bad faith claims',
          severity: 'high',
          issue: 'Waives your right to sue for improper claims handling',
          recommendation: 'This clause should be removed. You should not waive bad faith rights.'
        },
        {
          clause_text: 'Final and complete settlement of all claims',
          severity: 'medium',
          issue: 'May prevent recovery of depreciation or future supplements',
          recommendation: 'Ensure depreciation is paid before signing, or add language preserving right to recover depreciation'
        }
      ],
      red_flags: [
        'Release is not limited to the specific date of loss',
        'Language waives future claims',
        'No exception for recoverable depreciation',
        'Waives bad faith claims'
      ],
      recommendations: [
        'Do not sign this release without revisions',
        'Request a limited release that only covers the specific loss on the date of loss',
        'Ensure all depreciation has been paid before signing',
        'Remove any language waiving bad faith claims',
        'Consider consulting with an attorney before signing'
      ],
      safe_to_sign: false
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: mockReleaseAnalysis
      })
    };

  } catch (error) {
    console.error('Release analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Release analysis failed' }
      })
    };
  }
};

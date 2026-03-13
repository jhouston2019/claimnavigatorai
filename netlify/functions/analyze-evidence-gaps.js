/**
 * Netlify Function: analyze-evidence-gaps
 * Analyzes estimate discrepancies to identify documentation gaps
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
    const { claim_id } = JSON.parse(event.body);

    if (!claim_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: 'Missing claim_id' } })
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

    // Fetch existing discrepancies
    const { data: discrepancies, error: fetchError } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', claim_id);

    if (fetchError) throw fetchError;

    // TODO: Implement AI gap analysis using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Analyze discrepancies to identify documentation needs
    // 2. Call Claude API with gap analysis prompt
    // 3. Parse evidence gap recommendations
    // 4. Write results to claim_evidence_gaps table

    const mockEvidenceGaps = [
      {
        gap_type: 'photo_documentation',
        description: 'Missing close-up photos of roof damage showing granule loss and shingle deterioration',
        delta_amount: 6250,
        severity: 'high',
        resolved: false
      },
      {
        gap_type: 'contractor_statement',
        description: 'Need contractor statement explaining why architectural shingles are required (matching existing)',
        delta_amount: 6250,
        severity: 'high',
        resolved: false
      },
      {
        gap_type: 'photo_documentation',
        description: 'Missing photos of water-damaged drywall in master bedroom',
        delta_amount: 4200,
        severity: 'high',
        resolved: false
      },
      {
        gap_type: 'code_citation',
        description: 'Need building department citation requiring electrical panel upgrade',
        delta_amount: 2800,
        severity: 'medium',
        resolved: false
      }
    ];

    // Clear existing gaps and insert new ones
    await supabase
      .from('claim_evidence_gaps')
      .delete()
      .eq('claim_id', claim_id);

    for (const gap of mockEvidenceGaps) {
      const { error: insertError } = await supabase
        .from('claim_evidence_gaps')
        .insert({
          claim_id,
          ...gap,
          created_at: new Date().toISOString()
        });

      if (insertError) console.error('Gap insert error:', insertError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          evidence_gaps: mockEvidenceGaps,
          gap_count: mockEvidenceGaps.length
        }
      })
    };

  } catch (error) {
    console.error('Evidence gap analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Evidence gap analysis failed' }
      })
    };
  }
};

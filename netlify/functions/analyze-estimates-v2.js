/**
 * Netlify Function: analyze-estimates-v2
 * Performs line-by-line comparison of carrier and contractor estimates
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
    const {
      claim_id,
      carrier_estimate_pdf_url,
      contractor_estimate_pdf_url,
      carrier_document_id,
      contractor_document_id
    } = JSON.parse(event.body);

    if (!claim_id || !carrier_estimate_pdf_url || !contractor_estimate_pdf_url) {
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

    // TODO: Implement AI estimate comparison using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Download both PDFs
    // 2. Extract line items from each estimate
    // 3. Call Claude API with comparison prompt
    // 4. Parse discrepancies and missing items
    // 5. Write results to claim_estimate_discrepancies table

    const mockDiscrepancies = [
      {
        line_item: 'Roof replacement - architectural shingles',
        carrier_amount: 12500,
        contractor_amount: 18750,
        difference_amount: 6250,
        delta_type: 'undervalued',
        description: 'Carrier used 3-tab shingles pricing; contractor specified architectural grade'
      },
      {
        line_item: 'Water damage drywall replacement',
        carrier_amount: 0,
        contractor_amount: 4200,
        difference_amount: 4200,
        delta_type: 'missing',
        description: 'Carrier estimate omitted interior water damage to master bedroom walls'
      },
      {
        line_item: 'Code upgrade - electrical panel',
        carrier_amount: 0,
        contractor_amount: 2800,
        difference_amount: 2800,
        delta_type: 'missing',
        description: 'Required code upgrade not included in carrier estimate'
      }
    ];

    // Write discrepancies to Supabase
    for (const discrepancy of mockDiscrepancies) {
      const { error: insertError } = await supabase
        .from('claim_estimate_discrepancies')
        .insert({
          claim_id,
          carrier_document_id,
          contractor_document_id,
          ...discrepancy,
          created_at: new Date().toISOString()
        });

      if (insertError) console.error('Insert error:', insertError);
    }

    // Update financial summary
    const totalGap = mockDiscrepancies.reduce((sum, d) => sum + d.difference_amount, 0);
    
    const { error: summaryError } = await supabase
      .from('claim_financial_summary')
      .upsert({
        claim_id,
        underpayment_estimate: totalGap,
        updated_at: new Date().toISOString()
      });

    if (summaryError) console.error('Summary update error:', summaryError);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          discrepancies: mockDiscrepancies,
          total_gap: totalGap,
          discrepancy_count: mockDiscrepancies.length
        }
      })
    };

  } catch (error) {
    console.error('Estimate analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Estimate analysis failed' }
      })
    };
  }
};

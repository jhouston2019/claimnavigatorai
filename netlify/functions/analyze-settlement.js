/**
 * Netlify Function: analyze-settlement
 * Analyzes settlement letters to break down RCV, ACV, and depreciation
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
    const { claim_id, settlement_pdf_url, document_id } = JSON.parse(event.body);

    if (!claim_id || !settlement_pdf_url) {
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

    // TODO: Implement AI settlement analysis using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Download settlement PDF
    // 2. Extract text and parse payment breakdown
    // 3. Call Claude API with settlement analysis prompt
    // 4. Parse RCV, ACV, depreciation, and deductions
    // 5. Write results to claim_financial_summary table

    const mockSettlementAnalysis = {
      rcv_total: 45000,
      acv_paid: 32000,
      depreciation_withheld: 13000,
      deductible: 2500,
      prior_payments: 0,
      net_payment: 29500,
      breakdown: [
        { category: 'Dwelling', rcv: 38000, acv: 27000, depreciation: 11000 },
        { category: 'Other Structures', rcv: 5000, acv: 3500, depreciation: 1500 },
        { category: 'Personal Property', rcv: 2000, acv: 1500, depreciation: 500 }
      ]
    };

    // Update financial summary
    const { error: updateError } = await supabase
      .from('claim_financial_summary')
      .upsert({
        claim_id,
        rcv_total: mockSettlementAnalysis.rcv_total,
        acv_paid: mockSettlementAnalysis.acv_paid,
        depreciation_withheld: mockSettlementAnalysis.depreciation_withheld,
        deductible: mockSettlementAnalysis.deductible,
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: mockSettlementAnalysis
      })
    };

  } catch (error) {
    console.error('Settlement analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Settlement analysis failed' }
      })
    };
  }
};

/**
 * Netlify Function: analyze-policy-v2
 * Analyzes insurance policy documents using AI to extract coverage details
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
    const { claim_id, policy_pdf_url, document_id } = JSON.parse(event.body);

    if (!claim_id || !policy_pdf_url) {
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

    // TODO: Implement AI policy analysis using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Download the PDF from policy_pdf_url
    // 2. Extract text from PDF
    // 3. Call Claude API with policy analysis prompt
    // 4. Parse structured coverage data from response
    // 5. Write results to claim_policy_analysis table

    const mockAnalysisResult = {
      coverage_limits: {
        dwelling: 350000,
        other_structures: 35000,
        personal_property: 175000,
        loss_of_use: 70000,
        personal_liability: 300000,
        medical_payments: 5000
      },
      deductible: 2500,
      settlement_type: 'RCV',
      ordinance_law_coverage: true,
      ordinance_law_limit: 50000,
      matching_endorsement: true,
      special_provisions: [
        'Water backup coverage included ($10,000 limit)',
        'Equipment breakdown coverage',
        'Identity theft protection'
      ]
    };

    // Write to Supabase
    const { error: insertError } = await supabase
      .from('claim_policy_analysis')
      .upsert({
        claim_id,
        document_id,
        ...mockAnalysisResult,
        analyzed_at: new Date().toISOString()
      });

    if (insertError) throw insertError;

    // Update claim_policy_triggers
    const { error: triggerError } = await supabase
      .from('claim_policy_triggers')
      .upsert({
        claim_id,
        ordinance_trigger: mockAnalysisResult.ordinance_law_coverage,
        ordinance_trigger_amount: mockAnalysisResult.ordinance_law_limit,
        matching_trigger: mockAnalysisResult.matching_endorsement,
        updated_at: new Date().toISOString()
      });

    if (triggerError) throw triggerError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: mockAnalysisResult
      })
    };

  } catch (error) {
    console.error('Policy analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Policy analysis failed' }
      })
    };
  }
};

/**
 * Netlify Function: evaluate-escalation-status
 * Evaluates claim status and recommends escalation level
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

    // Fetch claim data
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claim_id)
      .single();

    if (claimError) throw claimError;

    // Fetch financial summary
    const { data: financial, error: finError } = await supabase
      .from('claim_financial_summary')
      .select('*')
      .eq('claim_id', claim_id)
      .single();

    // Fetch communication history
    const { data: communications, error: commError } = await supabase
      .from('claim_communications')
      .select('*')
      .eq('claim_id', claim_id)
      .order('created_at', { ascending: false });

    // Calculate escalation factors
    const dateOfLoss = new Date(claim.date_of_loss);
    const now = new Date();
    const daysSinceLoss = Math.floor((now - dateOfLoss) / (1000 * 60 * 60 * 24));
    
    const lastCommunication = communications?.[0];
    const daysSinceLastResponse = lastCommunication 
      ? Math.floor((now - new Date(lastCommunication.created_at)) / (1000 * 60 * 60 * 24))
      : null;

    const underpaymentAmount = financial?.underpayment_estimate || 0;

    // Determine escalation level
    let escalationLevel = 0;
    let recommendation = '';
    let templateType = null;

    if (underpaymentAmount === 0 && daysSinceLoss < 60) {
      escalationLevel = 0;
      recommendation = 'Your claim is progressing normally. Continue with the documented steps.';
    } else if (underpaymentAmount > 0 && underpaymentAmount < 5000 && daysSinceLastResponse < 14) {
      escalationLevel = 1;
      recommendation = 'Minor discrepancies identified. Submit a supplement request to the adjuster.';
      templateType = 'supervisor';
    } else if (underpaymentAmount >= 5000 && underpaymentAmount < 15000) {
      escalationLevel = 2;
      recommendation = 'Significant underpayment detected. Request escalation to the adjuster\'s supervisor and submit a formal demand letter.';
      templateType = 'supervisor';
    } else if (underpaymentAmount >= 15000 || daysSinceLastResponse >= 30) {
      escalationLevel = 3;
      recommendation = 'Substantial underpayment or claim delay. Consider filing a Department of Insurance complaint and consulting with a public adjuster or attorney.';
      templateType = 'doi_complaint';
    }

    // Check for appraisal trigger
    if (underpaymentAmount > 10000 && daysSinceLastResponse >= 21) {
      templateType = 'appraisal_demand';
      recommendation += ' You may also invoke the appraisal clause in your policy to resolve the valuation dispute.';
    }

    const result = {
      escalation_level: escalationLevel,
      recommendation,
      template_type: templateType,
      underpayment_amount: underpaymentAmount,
      days_since_loss: daysSinceLoss,
      days_since_last_response: daysSinceLastResponse,
      days_since_supplement: null
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ data: result })
    };

  } catch (error) {
    console.error('Escalation evaluation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Escalation evaluation failed' }
      })
    };
  }
};

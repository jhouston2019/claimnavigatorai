/**
 * Netlify Function: generate-demand-letter
 * Generates a formal demand letter with policy citations and specific amounts
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

    if (finError) throw finError;

    // TODO: Implement AI demand letter generation using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Gather all claim context, discrepancies, and evidence
    // 2. Call Claude API with demand letter prompt
    // 3. Generate professional demand with policy citations
    // 4. Return formatted letter content

    const demandAmount = financial?.underpayment_estimate || 0;

    const mockDemandLetter = `
[Date]

${claim.insurer_name}
Attn: ${claim.adjuster_name || 'Claims Department'}
Re: FORMAL DEMAND - Claim Number ${claim.claim_number}
    Date of Loss: ${claim.date_of_loss}
    Insured: [Policyholder Name]
    Policy Number: [Policy Number]

Dear ${claim.adjuster_name || 'Sir or Madam'}:

I am writing to formally demand payment of $${demandAmount.toLocaleString()} for underpaid and unpaid covered losses under the above-referenced claim.

BACKGROUND

On ${claim.date_of_loss}, my property sustained covered damage from [peril]. I promptly reported the loss and have fully cooperated with your investigation. Despite providing all requested documentation, your payment offer does not reflect the full extent of covered damage.

POLICY PROVISIONS

Under the policy, the insurer agreed to pay for "direct physical loss" to covered property. The policy provides Replacement Cost Value (RCV) coverage for the dwelling, meaning the insurer will pay the cost to repair or replace with materials of like kind and quality, without deduction for depreciation.

UNDERPAYMENT ANALYSIS

Your estimate undervalues the covered loss by $${demandAmount.toLocaleString()}. Specifically:

1. Missing line items totaling $[amount]
2. Undervalued materials and labor totaling $[amount]
3. Code upgrade requirements totaling $[amount]

A licensed contractor has provided a detailed estimate confirming the full scope and cost of repairs. This estimate is supported by photographs, material specifications, and building code citations.

DEMAND

I demand payment of $${demandAmount.toLocaleString()} within 15 business days of receipt of this letter. This amount represents the difference between your payment and the actual cost to repair the covered damage.

If payment is not received within 15 business days, I will pursue all available remedies, including filing a complaint with the state Department of Insurance and consulting with legal counsel regarding potential bad faith claims handling.

SUPPORTING DOCUMENTATION

Enclosed:
- Independent contractor estimate
- Photographic evidence
- Building code citations
- Line-by-line comparison of estimates

Please confirm receipt of this demand and provide a written response within 15 business days.

Sincerely,

[Policyholder Name]
[Address]
[Phone]
[Email]
    `.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          letter_content: mockDemandLetter,
          demand_amount: demandAmount
        }
      })
    };

  } catch (error) {
    console.error('Demand letter generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Demand letter generation failed' }
      })
    };
  }
};

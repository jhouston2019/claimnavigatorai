/**
 * Netlify Function: generate-supplement-v2
 * Generates a professional supplement claim letter with policy citations
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

    // Fetch discrepancies
    const { data: discrepancies, error: discError } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', claim_id);

    if (discError) throw discError;

    // TODO: Implement AI supplement letter generation using Claude API
    // This is a scaffold - actual implementation would:
    // 1. Gather claim context, discrepancies, and policy data
    // 2. Call Claude API with supplement letter prompt
    // 3. Generate professional letter with policy citations
    // 4. Return formatted letter content

    const totalSupplementAmount = discrepancies?.reduce((sum, d) => sum + d.difference_amount, 0) || 0;

    const mockSupplementLetter = `
[Date]

${claim.insurer_name}
Attn: ${claim.adjuster_name || 'Claims Department'}
Re: Claim Number ${claim.claim_number}
    Date of Loss: ${claim.date_of_loss}
    Insured: [Policyholder Name]

Dear ${claim.adjuster_name || 'Claims Adjuster'}:

I am writing to submit a supplemental claim for additional damage discovered during the repair process for the above-referenced claim.

SUPPLEMENTAL ITEMS

The following items were not included in your initial estimate dated [Date], but are necessary to complete the covered repairs:

${discrepancies?.map((d, i) => `
${i + 1}. ${d.line_item}
   Amount: $${d.difference_amount.toLocaleString()}
   Reason: ${d.description}
`).join('\n') || 'No discrepancies found'}

TOTAL SUPPLEMENTAL AMOUNT: $${totalSupplementAmount.toLocaleString()}

POLICY BASIS

These items are covered under the policy provisions for [Coverage Type]. The policy states that the insurer will pay for "direct physical loss" to the covered property. The supplemental items represent direct physical loss caused by the covered peril.

SUPPORTING DOCUMENTATION

Enclosed please find:
- Contractor estimate and scope of work
- Photographs documenting the additional damage
- Building code citations (where applicable)
- Material specifications

I request that you review this supplement promptly and issue payment for the additional covered items. Please contact me if you require any additional information.

Sincerely,

[Policyholder Name]
[Contact Information]
    `.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          letter_content: mockSupplementLetter,
          supplement_amount: totalSupplementAmount,
          item_count: discrepancies?.length || 0
        }
      })
    };

  } catch (error) {
    console.error('Supplement generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Supplement generation failed' }
      })
    };
  }
};

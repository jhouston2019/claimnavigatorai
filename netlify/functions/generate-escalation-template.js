/**
 * Netlify Function: generate-escalation-template
 * Generates escalation templates (supervisor request, DOI complaint, appraisal demand)
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
    const { claim_id, template_type } = JSON.parse(event.body);

    if (!claim_id || !template_type) {
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

    let templateContent = '';

    if (template_type === 'supervisor') {
      templateContent = `
[Date]

${claim.insurer_name}
Attn: Claims Supervisor
Re: Request for Supervisory Review - Claim ${claim.claim_number}

Dear Supervisor:

I am writing to request supervisory review of my claim, which has been assigned to ${claim.adjuster_name || '[Adjuster Name]'}.

Despite providing all requested documentation and cooperating fully with the claims process, I believe the settlement offer does not accurately reflect the full extent of covered damage.

ISSUES REQUIRING REVIEW:

1. Underpayment of approximately $${financial?.underpayment_estimate?.toLocaleString() || '0'}
2. Missing line items in the estimate
3. Undervalued materials and labor costs
4. Unaddressed code upgrade requirements

I have submitted supporting documentation including an independent contractor estimate, photographs, and building code citations. I request that a supervisor review this file and provide a written response addressing these concerns.

I am available to discuss this matter at your convenience.

Sincerely,

[Policyholder Name]
[Contact Information]
      `.trim();

    } else if (template_type === 'doi_complaint') {
      templateContent = `
[State] Department of Insurance
Consumer Services Division
[Address]

Re: Complaint Against ${claim.insurer_name}
    Claim Number: ${claim.claim_number}
    Policy Number: [Policy Number]
    Date of Loss: ${claim.date_of_loss}

Dear Department of Insurance:

I am filing a formal complaint against ${claim.insurer_name} for improper claims handling practices.

COMPLAINT SUMMARY:

The insurer has underpaid my claim by approximately $${financial?.underpayment_estimate?.toLocaleString() || '0'} and has failed to respond to my supplemental documentation requests.

SPECIFIC VIOLATIONS:

1. Failure to conduct a reasonable investigation
2. Failure to provide a reasonable explanation for claim denial/underpayment
3. Unreasonable delay in processing the claim
4. Failure to respond to written communications

TIMELINE:

- Date of Loss: ${claim.date_of_loss}
- Claim Reported: [Date]
- Initial Payment: [Date and Amount]
- Supplement Submitted: [Date]
- Days Without Response: [Number]

I have provided all requested documentation including contractor estimates, photographs, and building code citations. The insurer's estimate omits covered items and undervalues necessary repairs.

REQUESTED ACTION:

I request that the Department investigate this matter and require the insurer to:
1. Conduct a proper reinspection
2. Pay the full amount of covered damage
3. Respond to my supplement request within a reasonable timeframe

Attached please find copies of:
- Insurance policy
- Claim correspondence
- Contractor estimates
- Photographic evidence

Thank you for your attention to this matter.

Sincerely,

[Policyholder Name]
[Address]
[Phone]
[Email]
      `.trim();

    } else if (template_type === 'appraisal_demand') {
      templateContent = `
[Date]

${claim.insurer_name}
Attn: ${claim.adjuster_name || 'Claims Department'}
Re: DEMAND FOR APPRAISAL - Claim ${claim.claim_number}

Dear ${claim.adjuster_name || 'Sir or Madam'}:

This letter constitutes a formal demand for appraisal pursuant to the appraisal provision in the insurance policy.

The parties disagree on the amount of loss. Your estimate values the loss at $[Carrier Amount], while my independent contractor estimates the loss at $[Contractor Amount], a difference of $${financial?.underpayment_estimate?.toLocaleString() || '0'}.

APPRAISAL DEMAND:

Pursuant to the policy's appraisal clause, I hereby demand that this valuation dispute be resolved through the appraisal process. I have selected [Appraiser Name] as my appraiser.

Please provide the name and contact information for your appraiser within 20 days of receipt of this letter, as required by the policy.

If you fail to participate in the appraisal process, I will pursue all available legal remedies, including filing suit for breach of contract and bad faith.

APPRAISAL CLAUSE REFERENCE:

The policy states: "If you and we fail to agree on the amount of loss, either may demand an appraisal of the loss. In this event, each party will choose a competent appraiser within 20 days after receiving a written request from the other."

Please confirm receipt of this demand and provide your appraiser's information within 20 days.

Sincerely,

[Policyholder Name]
[Contact Information]

My Appraiser:
[Appraiser Name]
[Contact Information]
      `.trim();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: templateContent
      })
    };

  } catch (error) {
    console.error('Template generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Template generation failed' }
      })
    };
  }
};

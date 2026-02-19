/**
 * API Endpoint: /generate-escalation-template
 * Generates escalation templates (supervisor, DOI, appraisal)
 * Deterministic template generation based on claim data
 */

const { createClient } = require('@supabase/supabase-js');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const startTime = Date.now();
  let userId = null;

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
      };
    }

    // Validate authentication
    const authResult = await validateAuth(event.headers.authorization);
    if (!authResult.valid) {
      return sendError(authResult.error, 'AUTH-001', 401);
    }
    userId = authResult.user.id;

    // Parse and validate request body
    const body = parseBody(event.body);
    
    if (!body.claim_id) {
      return sendError('claim_id is required', 'VAL-001', 400);
    }

    if (!body.template_type) {
      return sendError('template_type is required', 'VAL-002', 400);
    }

    const validTemplates = ['supervisor', 'doi_complaint', 'appraisal_demand'];
    if (!validTemplates.includes(body.template_type)) {
      return sendError(`Invalid template_type. Must be one of: ${validTemplates.join(', ')}`, 'VAL-003', 400);
    }

    // Validate claim ownership
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    console.log(`[Escalation Template] Generating ${body.template_type} for claim ${claim.claim_number}`);

    // =====================================================
    // FETCH REQUIRED DATA
    // =====================================================
    
    // Get policy information
    const { data: policy } = await supabase
      .from('claim_policies')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    // Get financial summary
    const { data: financial } = await supabase
      .from('claim_financial_summary')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    // Get escalation status
    const { data: escalation } = await supabase
      .from('claim_escalation_status')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    // Get supplement info
    const { data: supplements } = await supabase
      .from('claim_generated_documents')
      .select('created_at')
      .eq('claim_id', body.claim_id)
      .eq('document_type', 'supplement_v2')
      .order('created_at', { ascending: false })
      .limit(1);

    const supplementDate = supplements && supplements.length > 0 
      ? new Date(supplements[0].created_at).toLocaleDateString()
      : 'N/A';

    // =====================================================
    // GENERATE TEMPLATE
    // =====================================================
    let template = '';

    switch (body.template_type) {
      case 'supervisor':
        template = generateSupervisorTemplate(claim, policy, financial, escalation, supplementDate);
        break;
      case 'doi_complaint':
        template = generateDOITemplate(claim, policy, financial, escalation, supplementDate);
        break;
      case 'appraisal_demand':
        template = generateAppraisalTemplate(claim, policy, financial, escalation, supplementDate);
        break;
    }

    // =====================================================
    // STORE TEMPLATE
    // =====================================================
    const { data: stored, error: storeError } = await supabase
      .from('claim_generated_documents')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        document_type: `escalation_${body.template_type}`,
        document_content: template,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing template:', storeError);
    }

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/generate-escalation-template',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Escalation Template] Generation complete in ${Date.now() - startTime}ms`);

    return sendSuccess({
      template: template,
      template_type: body.template_type,
      stored: !!stored,
      processing_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('[Escalation Template] Generation error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/generate-escalation-template',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Escalation template generation failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

// =====================================================
// TEMPLATE GENERATORS
// =====================================================

/**
 * Generate supervisor escalation letter
 */
function generateSupervisorTemplate(claim, policy, financial, escalation, supplementDate) {
  const today = new Date().toLocaleDateString();
  const underpayment = financial?.underpayment_estimate || 0;
  const daysSince = escalation?.days_since_supplement || 0;

  return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: right; margin-bottom: 30px;">
    <strong>${today}</strong>
  </div>

  <div style="margin-bottom: 30px;">
    <strong>RE: Claim ${claim.claim_number} - Request for Supervisor Review</strong><br>
    Policy: ${policy?.policy_number || 'N/A'}<br>
    Insured: ${claim.policyholder_name || 'N/A'}<br>
    Property: ${claim.property_address || 'N/A'}
  </div>

  <p>Dear Claims Supervisor,</p>

  <p>I am writing to request immediate supervisor review of the above-referenced claim. A supplement was submitted on <strong>${supplementDate}</strong> (${daysSince} days ago) documenting an underpayment of <strong>$${underpayment.toLocaleString()}</strong>.</p>

  <p><strong>Issue:</strong> The carrier estimate contains significant scope deficiencies and valuation errors that were documented in detail in the supplement submission. Despite the passage of ${daysSince} days, we have not received a response or revised payment.</p>

  <p><strong>Requested Action:</strong></p>
  <ul>
    <li>Immediate supervisor review of the supplement documentation</li>
    <li>Revised estimate addressing the documented discrepancies</li>
    <li>Revised payment issued within 10 business days</li>
  </ul>

  <p><strong>Supporting Documentation:</strong> The supplement includes deterministic line-item reconciliation, code compliance analysis, and policy coverage crosswalk. All calculations are based on industry-standard pricing and documented building code requirements.</p>

  <p>The underpayment amount of $${underpayment.toLocaleString()} represents the difference between the carrier estimate and the actual scope of work required to restore the property to pre-loss condition in compliance with applicable building codes and policy terms.</p>

  <p>Please confirm receipt of this request and provide a timeline for supervisor review and revised payment.</p>

  <p>Sincerely,<br>
  ${claim.policyholder_name || '[Policyholder Name]'}</p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
    <p><strong>Claim Reference:</strong> ${claim.claim_number}<br>
    <strong>Supplement Submitted:</strong> ${supplementDate}<br>
    <strong>Days Since Submission:</strong> ${daysSince}<br>
    <strong>Documented Underpayment:</strong> $${underpayment.toLocaleString()}</p>
  </div>
</div>
  `.trim();
}

/**
 * Generate DOI complaint template
 */
function generateDOITemplate(claim, policy, financial, escalation, supplementDate) {
  const today = new Date().toLocaleDateString();
  const underpayment = financial?.underpayment_estimate || 0;
  const daysSince = escalation?.days_since_supplement || 0;
  const daysSinceResponse = escalation?.days_since_last_response || 0;

  return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2>DEPARTMENT OF INSURANCE COMPLAINT</h2>
  </div>

  <div style="margin-bottom: 30px;">
    <strong>Complaint Date:</strong> ${today}<br>
    <strong>Claim Number:</strong> ${claim.claim_number}<br>
    <strong>Policy Number:</strong> ${policy?.policy_number || 'N/A'}<br>
    <strong>Insurance Carrier:</strong> ${policy?.carrier_name || 'N/A'}<br>
    <strong>Insured:</strong> ${claim.policyholder_name || 'N/A'}<br>
    <strong>Property Address:</strong> ${claim.property_address || 'N/A'}<br>
    <strong>Loss Date:</strong> ${claim.loss_date ? new Date(claim.loss_date).toLocaleDateString() : 'N/A'}
  </div>

  <h3>NATURE OF COMPLAINT</h3>
  <p>The insurance carrier has failed to respond to a documented supplement submission within a reasonable timeframe, in violation of state insurance regulations regarding prompt claim handling.</p>

  <h3>TIMELINE OF EVENTS</h3>
  <ul>
    <li><strong>Loss Date:</strong> ${claim.loss_date ? new Date(claim.loss_date).toLocaleDateString() : 'N/A'}</li>
    <li><strong>Initial Estimate Received:</strong> [Date]</li>
    <li><strong>Supplement Submitted:</strong> ${supplementDate}</li>
    <li><strong>Days Since Supplement:</strong> ${daysSince} days</li>
    <li><strong>Days Since Last Carrier Response:</strong> ${daysSinceResponse} days</li>
  </ul>

  <h3>DOCUMENTED UNDERPAYMENT</h3>
  <p>The supplement documented an underpayment of <strong>$${underpayment.toLocaleString()}</strong> based on deterministic line-item reconciliation and code compliance analysis. The carrier estimate contains the following deficiencies:</p>
  <ul>
    <li>Missing scope items required for proper restoration</li>
    <li>Undervalued line items below industry-standard pricing</li>
    <li>Failure to account for required building code upgrades</li>
    <li>Improper application of depreciation schedules</li>
  </ul>

  <h3>VIOLATION OF INSURANCE REGULATIONS</h3>
  <p>The carrier's failure to respond to the supplement within ${daysSince} days violates state insurance regulations requiring prompt investigation and payment of claims. Specifically:</p>
  <ul>
    <li>Unreasonable delay in claim processing</li>
    <li>Failure to provide timely written response to supplement</li>
    <li>Failure to conduct reasonable investigation of documented discrepancies</li>
  </ul>

  <h3>REQUESTED ACTION</h3>
  <p>I request that the Department of Insurance:</p>
  <ol>
    <li>Investigate this complaint for violations of state insurance regulations</li>
    <li>Compel the carrier to provide immediate written response to the supplement</li>
    <li>Compel the carrier to issue revised payment for the documented underpayment</li>
    <li>Take appropriate regulatory action against the carrier for unreasonable delay</li>
  </ol>

  <h3>SUPPORTING DOCUMENTATION</h3>
  <p>Attached:</p>
  <ul>
    <li>Original carrier estimate</li>
    <li>Contractor estimate</li>
    <li>Supplement with line-item reconciliation</li>
    <li>Code compliance documentation</li>
    <li>Policy declarations page</li>
    <li>All correspondence with carrier</li>
  </ul>

  <p>I declare under penalty of perjury that the information provided in this complaint is true and correct to the best of my knowledge.</p>

  <div style="margin-top: 40px;">
    <p>Respectfully submitted,</p>
    <p><strong>${claim.policyholder_name || '[Policyholder Name]'}</strong><br>
    ${claim.property_address || '[Property Address]'}<br>
    [Phone Number]<br>
    [Email Address]</p>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
    <p><strong>Complaint Reference:</strong> ${claim.claim_number}<br>
    <strong>Date Filed:</strong> ${today}<br>
    <strong>Underpayment Amount:</strong> $${underpayment.toLocaleString()}<br>
    <strong>Days Without Response:</strong> ${daysSince}</p>
  </div>
</div>
  `.trim();
}

/**
 * Generate appraisal demand template
 */
function generateAppraisalTemplate(claim, policy, financial, escalation, supplementDate) {
  const today = new Date().toLocaleDateString();
  const underpayment = financial?.underpayment_estimate || 0;
  const daysSince = escalation?.days_since_supplement || 0;

  return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: right; margin-bottom: 30px;">
    <strong>${today}</strong>
  </div>

  <div style="margin-bottom: 30px;">
    <strong>SENT VIA CERTIFIED MAIL</strong>
  </div>

  <div style="margin-bottom: 30px;">
    [Insurance Carrier Name]<br>
    [Claims Department Address]<br>
    [City, State ZIP]
  </div>

  <div style="margin-bottom: 30px;">
    <strong>RE: DEMAND FOR APPRAISAL</strong><br>
    Claim Number: ${claim.claim_number}<br>
    Policy Number: ${policy?.policy_number || 'N/A'}<br>
    Insured: ${claim.policyholder_name || 'N/A'}<br>
    Property: ${claim.property_address || 'N/A'}<br>
    Loss Date: ${claim.loss_date ? new Date(claim.loss_date).toLocaleDateString() : 'N/A'}
  </div>

  <p>Dear Claims Representative,</p>

  <p>This letter constitutes formal demand to invoke the Appraisal Clause contained in the above-referenced insurance policy.</p>

  <h3>BACKGROUND</h3>
  <p>A supplement was submitted on <strong>${supplementDate}</strong> (${daysSince} days ago) documenting significant discrepancies between the carrier estimate and the actual scope of work required to restore the property. The supplement documented an underpayment of <strong>$${underpayment.toLocaleString()}</strong> based on deterministic line-item reconciliation.</p>

  <p>Despite the passage of ${daysSince} days and multiple attempts to resolve this matter through the normal claims process, the carrier has failed to provide adequate response or revised payment.</p>

  <h3>DISPUTED AMOUNT</h3>
  <p>The parties disagree on the amount of loss. Specifically:</p>
  <ul>
    <li><strong>Carrier Estimate:</strong> [Carrier Amount]</li>
    <li><strong>Documented Actual Loss:</strong> [Contractor Amount]</li>
    <li><strong>Disputed Amount:</strong> $${underpayment.toLocaleString()}</li>
  </ul>

  <h3>INVOCATION OF APPRAISAL CLAUSE</h3>
  <p>Pursuant to the Appraisal provision of the policy, I demand that this dispute be resolved through the appraisal process. The policy states:</p>

  <blockquote style="margin: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #333;">
    "If you and we fail to agree on the amount of loss, either may demand an appraisal of the loss. In this event, each party will choose a competent and impartial appraiser within 20 days after receiving a written request from the other. The two appraisers will choose an umpire. If they cannot agree upon an umpire within 15 days, you or we may request that the choice be made by a judge of a court of record in the state where the property is located."
  </blockquote>

  <h3>APPOINTMENT OF APPRAISER</h3>
  <p>I have appointed the following individual as my appraiser:</p>

  <div style="margin: 20px; padding: 15px; background: #f9f9f9;">
    <strong>[Appraiser Name]</strong><br>
    [Company Name]<br>
    [Address]<br>
    [Phone]<br>
    [Email]
  </div>

  <h3>REQUIRED ACTION</h3>
  <p>Pursuant to the policy terms, you are required to:</p>
  <ol>
    <li>Appoint your competent and impartial appraiser within 20 days of receipt of this demand</li>
    <li>Provide written notice of your appraiser's name and contact information</li>
    <li>Instruct your appraiser to contact my appraiser to select an umpire</li>
  </ol>

  <h3>SCOPE OF APPRAISAL</h3>
  <p>The appraisal will determine the amount of loss for the following disputed items:</p>
  <ul>
    <li>Missing scope items documented in the supplement</li>
    <li>Undervalued line items with pricing discrepancies</li>
    <li>Required building code upgrades</li>
    <li>Proper application of depreciation schedules</li>
    <li>Overhead and profit calculations</li>
  </ul>

  <p>All supporting documentation, including the original carrier estimate, contractor estimate, supplement, code compliance analysis, and policy coverage crosswalk, will be provided to the appraisers.</p>

  <h3>RESERVATION OF RIGHTS</h3>
  <p>This demand for appraisal is made without prejudice to any other rights or remedies available under the policy or applicable law, including but not limited to claims for bad faith, breach of contract, or violations of state insurance regulations.</p>

  <p>Please confirm receipt of this demand and provide written notice of your appointed appraiser within 20 days.</p>

  <p>Sincerely,</p>

  <p><strong>${claim.policyholder_name || '[Policyholder Name]'}</strong><br>
  ${claim.property_address || '[Property Address]'}<br>
  [Phone Number]<br>
  [Email Address]</p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
    <p><strong>Claim Reference:</strong> ${claim.claim_number}<br>
    <strong>Appraisal Demand Date:</strong> ${today}<br>
    <strong>Disputed Amount:</strong> $${underpayment.toLocaleString()}<br>
    <strong>Supplement Submitted:</strong> ${supplementDate}<br>
    <strong>Days Without Resolution:</strong> ${daysSince}</p>
  </div>
</div>
  `.trim();
}

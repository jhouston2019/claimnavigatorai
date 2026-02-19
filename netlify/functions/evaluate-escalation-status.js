/**
 * API Endpoint: /evaluate-escalation-status
 * Evaluates escalation requirements based on claim activity
 * Deterministic escalation logic
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

    // Validate claim ownership
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id, claim_number')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    console.log(`[Escalation] Evaluating escalation for claim ${claim.claim_number}`);

    // =====================================================
    // STEP 1: GET FINANCIAL SUMMARY
    // =====================================================
    const { data: financial } = await supabase
      .from('claim_financial_summary')
      .select('underpayment_estimate')
      .eq('claim_id', body.claim_id)
      .single();

    const underpaymentAmount = financial?.underpayment_estimate || 0;
    const threshold = body.threshold || 5000.00;

    // =====================================================
    // STEP 2: CHECK SUPPLEMENT SUBMISSION DATE
    // =====================================================
    const { data: supplements } = await supabase
      .from('claim_generated_documents')
      .select('created_at')
      .eq('claim_id', body.claim_id)
      .eq('document_type', 'supplement_v2')
      .order('created_at', { ascending: false })
      .limit(1);

    let daysSinceSupplement = null;
    let supplementDate = null;

    if (supplements && supplements.length > 0) {
      supplementDate = new Date(supplements[0].created_at);
      const now = new Date();
      const diffTime = Math.abs(now - supplementDate);
      daysSinceSupplement = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // =====================================================
    // STEP 3: CHECK LAST CARRIER RESPONSE
    // =====================================================
    const { data: journal } = await supabase
      .from('claim_journal')
      .select('event_date, event_type')
      .eq('claim_id', body.claim_id)
      .in('event_type', ['carrier_response', 'adjuster_call', 'settlement_received'])
      .order('event_date', { ascending: false })
      .limit(1);

    let daysSinceLastResponse = null;
    let lastResponseDate = null;

    if (journal && journal.length > 0) {
      lastResponseDate = new Date(journal[0].event_date);
      const now = new Date();
      const diffTime = Math.abs(now - lastResponseDate);
      daysSinceLastResponse = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // =====================================================
    // STEP 4: DETERMINE ESCALATION LEVEL
    // =====================================================
    let escalationLevel = 0;
    let recommendation = 'No escalation required';
    let templateType = 'none';

    // Level 3: Appraisal clause trigger
    if (underpaymentAmount > threshold && 
        daysSinceSupplement !== null && 
        daysSinceSupplement > 30 &&
        daysSinceLastResponse !== null &&
        daysSinceLastResponse > 15) {
      escalationLevel = 3;
      recommendation = 'Carrier has not responded to supplement for over 30 days. Invoke appraisal clause.';
      templateType = 'appraisal_demand';
    }
    // Level 2: DOI complaint
    else if (underpaymentAmount > threshold && 
             daysSinceSupplement !== null && 
             daysSinceSupplement > 20 &&
             daysSinceLastResponse !== null &&
             daysSinceLastResponse > 10) {
      escalationLevel = 2;
      recommendation = 'Carrier has delayed response beyond reasonable timeframe. File DOI complaint.';
      templateType = 'doi_complaint';
    }
    // Level 1: Supervisor escalation
    else if (underpaymentAmount > threshold && 
             daysSinceSupplement !== null && 
             daysSinceSupplement > 10) {
      escalationLevel = 1;
      recommendation = 'Supplement submitted over 10 days ago. Request supervisor review.';
      templateType = 'supervisor';
    }

    // =====================================================
    // STEP 5: STORE ESCALATION STATUS
    // =====================================================
    const { data: escalationStatus, error: escalationError } = await supabase
      .from('claim_escalation_status')
      .upsert({
        claim_id: body.claim_id,
        user_id: userId,
        escalation_level: escalationLevel,
        underpayment_amount: underpaymentAmount,
        underpayment_threshold: threshold,
        days_since_supplement: daysSinceSupplement,
        days_since_last_response: daysSinceLastResponse,
        supplement_submitted_date: supplementDate ? supplementDate.toISOString().split('T')[0] : null,
        last_carrier_response_date: lastResponseDate ? lastResponseDate.toISOString().split('T')[0] : null,
        recommendation: recommendation,
        template_type: templateType,
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id'
      })
      .select()
      .single();

    if (escalationError) {
      console.error('Failed to store escalation status:', escalationError);
      return sendError('Failed to store escalation status', 'DB-001', 500);
    }

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/evaluate-escalation-status',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Escalation] Evaluation complete: Level ${escalationLevel}`);

    return sendSuccess({
      escalation_level: escalationLevel,
      recommendation: recommendation,
      template_type: templateType,
      underpayment_amount: underpaymentAmount,
      days_since_supplement: daysSinceSupplement,
      days_since_last_response: daysSinceLastResponse,
      processing_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('[Escalation] Evaluation error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/evaluate-escalation-status',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Escalation evaluation failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

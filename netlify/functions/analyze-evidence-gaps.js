/**
 * API Endpoint: /analyze-evidence-gaps
 * Detects missing documentation and proof requirements
 * Deterministic gap detection based on claim data
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

    console.log(`[Evidence Gaps] Analyzing gaps for claim ${claim.claim_number}`);

    // =====================================================
    // STEP 1: CHECK FOR REQUIRED DOCUMENTS
    // =====================================================
    const { data: documents } = await supabase
      .from('claim_documents')
      .select('document_type')
      .eq('claim_id', body.claim_id);

    const docTypes = new Set((documents || []).map(d => d.document_type));
    
    const gaps = [];

    // Check contractor estimate
    if (!docTypes.has('contractor_estimate')) {
      gaps.push({
        claim_id: body.claim_id,
        user_id: userId,
        gap_type: 'contractor_estimate_missing',
        description: 'Contractor estimate required for estimate comparison',
        severity: 'critical'
      });
    }

    // Check carrier estimate
    if (!docTypes.has('carrier_estimate')) {
      gaps.push({
        claim_id: body.claim_id,
        user_id: userId,
        gap_type: 'carrier_estimate_missing',
        description: 'Carrier estimate required for estimate comparison',
        severity: 'critical'
      });
    }

    // Check moisture report (if water damage)
    const { data: lossType } = await supabase
      .from('claims')
      .select('loss_type')
      .eq('id', body.claim_id)
      .single();

    if (lossType?.loss_type && lossType.loss_type.toLowerCase().includes('water')) {
      if (!docTypes.has('moisture_report')) {
        gaps.push({
          claim_id: body.claim_id,
          user_id: userId,
          gap_type: 'moisture_report_missing',
          description: 'Moisture report required for water damage claims',
          severity: 'high'
        });
      }
    }

    // =====================================================
    // STEP 2: CHECK FOR CODE DOCUMENTATION
    // =====================================================
    const { data: codeUpgrades } = await supabase
      .from('claim_enforcement_reports')
      .select('code_upgrade_flags, code_upgrade_flag_count')
      .eq('claim_id', body.claim_id)
      .single();

    if (codeUpgrades && codeUpgrades.code_upgrade_flag_count > 0) {
      // Check if code documentation exists
      if (!docTypes.has('code_documentation') && !docTypes.has('building_permit')) {
        gaps.push({
          claim_id: body.claim_id,
          user_id: userId,
          gap_type: 'code_documentation_missing',
          description: 'Building code citations required for code upgrade claims',
          severity: 'high'
        });
      }
    }

    // =====================================================
    // STEP 3: CHECK HIGH-VALUE DELTAS FOR DOCUMENTATION
    // =====================================================
    const { data: discrepancies } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', body.claim_id)
      .gte('difference_amount', 1000); // High-value items

    if (discrepancies && discrepancies.length > 0) {
      for (const disc of discrepancies) {
        // Check if this item has supporting documentation
        const needsProof = disc.delta_type === 'missing_item' || 
                          disc.difference_amount > 2500;

        if (needsProof) {
          // Check for damage photos
          const hasPhotos = docTypes.has('damage_photos') || docTypes.has('photo_documentation');
          if (!hasPhotos) {
            gaps.push({
              claim_id: body.claim_id,
              user_id: userId,
              gap_type: 'damage_photo_missing',
              description: `Photo documentation required for ${disc.description}`,
              line_item_reference: disc.description,
              delta_amount: disc.difference_amount,
              severity: disc.difference_amount > 5000 ? 'critical' : 'high'
            });
          }

          // Check for contractor narrative
          if (disc.delta_type === 'missing_item' && !docTypes.has('contractor_narrative')) {
            gaps.push({
              claim_id: body.claim_id,
              user_id: userId,
              gap_type: 'contractor_narrative_missing',
              description: `Contractor explanation required for missing item: ${disc.description}`,
              line_item_reference: disc.description,
              delta_amount: disc.difference_amount,
              severity: 'high'
            });
          }

          // Check for pricing support
          if (disc.delta_type === 'pricing_difference' && disc.difference_amount > 1500) {
            gaps.push({
              claim_id: body.claim_id,
              user_id: userId,
              gap_type: 'pricing_support_missing',
              description: `Pricing justification required for ${disc.description}`,
              line_item_reference: disc.description,
              delta_amount: disc.difference_amount,
              severity: 'medium'
            });
          }
        }
      }
    }

    // =====================================================
    // STEP 4: CHECK POLICY TRIGGERS FOR REQUIRED PROOF
    // =====================================================
    const { data: triggers } = await supabase
      .from('claim_policy_triggers')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    if (triggers) {
      // Ordinance trigger requires code citation
      if (triggers.ordinance_trigger && !docTypes.has('code_citation')) {
        gaps.push({
          claim_id: body.claim_id,
          user_id: userId,
          gap_type: 'code_citation_missing',
          description: 'Building department code citation required for ordinance coverage',
          delta_amount: triggers.ordinance_trigger_amount,
          severity: 'critical'
        });
      }

      // Matching trigger requires photo evidence
      if (triggers.matching_trigger && !docTypes.has('mismatch_photos')) {
        gaps.push({
          claim_id: body.claim_id,
          user_id: userId,
          gap_type: 'damage_photo_missing',
          description: 'Photo evidence of material mismatch required for matching endorsement',
          severity: 'high'
        });
      }
    }

    // =====================================================
    // STEP 5: STORE GAPS IN DATABASE
    // =====================================================
    console.log(`[Evidence Gaps] Detected ${gaps.length} gaps`);

    // Clear existing gaps for this claim
    await supabase
      .from('claim_evidence_gaps')
      .delete()
      .eq('claim_id', body.claim_id);

    // Insert new gaps
    if (gaps.length > 0) {
      const { error: insertError } = await supabase
        .from('claim_evidence_gaps')
        .insert(gaps);

      if (insertError) {
        console.error('Failed to store evidence gaps:', insertError);
        return sendError('Failed to store evidence gaps', 'DB-001', 500);
      }
    }

    // =====================================================
    // STEP 6: GENERATE SUMMARY
    // =====================================================
    const summary = {
      total_gaps: gaps.length,
      critical_gaps: gaps.filter(g => g.severity === 'critical').length,
      high_gaps: gaps.filter(g => g.severity === 'high').length,
      medium_gaps: gaps.filter(g => g.severity === 'medium').length,
      low_gaps: gaps.filter(g => g.severity === 'low').length,
      total_exposure_at_risk: gaps.reduce((sum, g) => sum + (g.delta_amount || 0), 0)
    };

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/analyze-evidence-gaps',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Evidence Gaps] Analysis complete in ${Date.now() - startTime}ms`);

    return sendSuccess({
      gaps: gaps,
      summary: summary,
      processing_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('[Evidence Gaps] Analysis error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-evidence-gaps',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Evidence gap analysis failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

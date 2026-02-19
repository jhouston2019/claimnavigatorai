/**
 * API Endpoint: /export-reconciliation-report
 * Exports financial exposure report in structured formats
 * Supports: JSON, CSV-ready, PDF-ready, Supplement-ready
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
    
    const format = body.format || 'json'; // 'json', 'csv', 'pdf', 'supplement'
    
    if (!['json', 'csv', 'pdf', 'supplement'].includes(format)) {
      return sendError('Invalid format. Must be: json, csv, pdf, or supplement', 'VAL-002', 400);
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

    console.log(`[Export] Exporting reconciliation report for claim ${claim.claim_number} in ${format} format`);

    // =====================================================
    // PHASE 1: RETRIEVE FINANCIAL EXPOSURE REPORT
    // =====================================================
    const { data: exposureReport, error: exposureError } = await supabase
      .from('claim_financial_exposure_reports')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    if (exposureError || !exposureReport) {
      return sendError('Financial exposure report not found. Run estimate analysis first.', 'REPORT-001', 404);
    }

    // =====================================================
    // PHASE 2: RETRIEVE CLAIM DETAILS
    // =====================================================
    const { data: claimDetails } = await supabase
      .from('claims')
      .select('claim_number, insurance_company, date_of_loss, property_address')
      .eq('id', body.claim_id)
      .single();

    // =====================================================
    // PHASE 3: FORMAT EXPORT
    // =====================================================
    let exportData;
    
    switch (format) {
      case 'json':
        exportData = formatJSON(exposureReport, claimDetails);
        break;
      
      case 'csv':
        exportData = formatCSV(exposureReport, claimDetails);
        break;
      
      case 'pdf':
        exportData = formatPDFReady(exposureReport, claimDetails);
        break;
      
      case 'supplement':
        exportData = formatSupplementReady(exposureReport, claimDetails);
        break;
      
      default:
        exportData = formatJSON(exposureReport, claimDetails);
    }

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/export-reconciliation-report',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    console.log(`[Export] Export complete in ${Date.now() - startTime}ms`);

    return sendSuccess({
      format: format,
      claim_number: claim.claim_number,
      export_data: exportData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Export] Export error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/export-reconciliation-report',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Export failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};

/**
 * Format as JSON (complete payload)
 */
function formatJSON(exposureReport, claimDetails) {
  return {
    claim: {
      claim_number: claimDetails?.claim_number,
      insurance_company: claimDetails?.insurance_company,
      date_of_loss: claimDetails?.date_of_loss,
      property_address: claimDetails?.property_address
    },
    
    financial_exposure: {
      total_projected_recovery: exposureReport.total_projected_recovery,
      rcv_delta_total: exposureReport.rcv_delta_total,
      acv_delta_total: exposureReport.acv_delta_total,
      recoverable_depreciation_total: exposureReport.recoverable_depreciation_total
    },
    
    op_exposure: {
      qualifies: exposureReport.op_qualifies,
      amount: exposureReport.op_amount,
      trades_detected: exposureReport.op_trades_detected,
      trade_count: exposureReport.op_trade_count,
      reason: exposureReport.op_reason,
      calculation: exposureReport.op_calculation
    },
    
    category_breakdown: exposureReport.category_breakdown,
    
    line_item_deltas: exposureReport.structured_line_item_deltas,
    
    negotiation_points: exposureReport.negotiation_points,
    
    metadata: {
      generated_at: exposureReport.created_at,
      engine_version: exposureReport.engine_version,
      calculation_method: exposureReport.calculation_method
    }
  };
}

/**
 * Format as CSV-ready structure
 */
function formatCSV(exposureReport, claimDetails) {
  const lineItemDeltas = exposureReport.structured_line_item_deltas || [];
  
  const csvRows = lineItemDeltas.map(item => ({
    'Claim Number': claimDetails?.claim_number || '',
    'Description': item.description,
    'Category': item.category,
    'Discrepancy Type': item.discrepancyType,
    'Carrier Qty': item.carrierQty,
    'Contractor Qty': item.contractorQty,
    'Qty Delta': item.qtyDelta,
    'Carrier Unit Price': item.carrierUnitPrice,
    'Contractor Unit Price': item.contractorUnitPrice,
    'Unit Price Delta': item.unitPriceDelta,
    'Carrier Total': item.carrierTotal,
    'Contractor Total': item.contractorTotal,
    'RCV Delta': item.rcvDelta,
    'ACV Delta': item.acvDelta,
    'Depreciation Delta': item.depreciationDelta,
    'Match Method': item.matchMethod,
    'Notes': item.notes
  }));
  
  return {
    summary: {
      claim_number: claimDetails?.claim_number,
      total_projected_recovery: exposureReport.total_projected_recovery,
      rcv_delta_total: exposureReport.rcv_delta_total,
      acv_delta_total: exposureReport.acv_delta_total,
      recoverable_depreciation_total: exposureReport.recoverable_depreciation_total,
      op_exposure: exposureReport.op_amount
    },
    rows: csvRows,
    headers: Object.keys(csvRows[0] || {})
  };
}

/**
 * Format as PDF-ready structure
 */
function formatPDFReady(exposureReport, claimDetails) {
  return {
    document_type: 'Estimate Reconciliation Report',
    
    header: {
      claim_number: claimDetails?.claim_number,
      insurance_company: claimDetails?.insurance_company,
      date_of_loss: claimDetails?.date_of_loss,
      property_address: claimDetails?.property_address,
      report_date: new Date().toISOString().split('T')[0]
    },
    
    executive_summary: {
      title: 'Financial Exposure Summary',
      total_projected_recovery: exposureReport.total_projected_recovery,
      rcv_delta: exposureReport.rcv_delta_total,
      acv_delta: exposureReport.acv_delta_total,
      recoverable_depreciation: exposureReport.recoverable_depreciation_total,
      op_exposure: exposureReport.op_amount
    },
    
    op_analysis: {
      title: 'Overhead & Profit Analysis',
      qualifies: exposureReport.op_qualifies,
      trades_detected: exposureReport.op_trades_detected,
      trade_count: exposureReport.op_trade_count,
      amount: exposureReport.op_amount,
      reason: exposureReport.op_reason
    },
    
    category_breakdown: {
      title: 'Category-Level Exposure',
      categories: exposureReport.category_breakdown
    },
    
    line_item_reconciliation: {
      title: 'Line Item Reconciliation Table',
      items: exposureReport.structured_line_item_deltas
    },
    
    negotiation_points: {
      title: 'Negotiation Points',
      points: exposureReport.negotiation_points
    }
  };
}

/**
 * Format as supplement-ready structure
 */
function formatSupplementReady(exposureReport, claimDetails) {
  const negotiationPayload = exposureReport.negotiation_payload || {};
  
  return {
    claim_id: exposureReport.claim_id,
    claim_number: claimDetails?.claim_number,
    
    // Summary for supplement letter
    summary: {
      total_additional_amount_requested: exposureReport.total_projected_recovery,
      rcv_delta: exposureReport.rcv_delta_total,
      op_exposure: exposureReport.op_amount
    },
    
    // Category-level items for supplement sections
    categories: (exposureReport.category_breakdown || []).map(cat => ({
      category: cat.category,
      amount: cat.rcvDelta,
      discrepancy_count: cat.discrepancyCount,
      percent_underpaid: cat.percentUnderpaid
    })),
    
    // Line items for detailed supplement
    line_items: (exposureReport.structured_line_item_deltas || [])
      .filter(item => item.rcvDelta > 0)
      .map(item => ({
        description: item.description,
        category: item.category,
        discrepancy_type: item.discrepancyType,
        carrier_amount: item.carrierTotal,
        requested_amount: item.contractorTotal,
        difference: item.rcvDelta,
        justification: item.notes
      })),
    
    // O&P justification
    op_justification: exposureReport.op_qualifies ? {
      applies: true,
      trades: exposureReport.op_trades_detected,
      amount: exposureReport.op_amount,
      reason: exposureReport.op_reason
    } : null,
    
    // Negotiation points for letter body
    negotiation_points: negotiationPayload.negotiationPoints || [],
    
    // Metadata
    generated_at: new Date().toISOString()
  };
}

module.exports = { handler };

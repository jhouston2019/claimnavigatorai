/**
 * API Endpoint: /estimate/interpret
 * Interprets contractor estimate
 */

const { sendSuccess, sendError, validateSchema, sanitizeInput } = require('./lib/api-utils');

// Security configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50 MB default
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

exports.handler = async (event) => {
  try {
    const { body, userId } = event;

    // Validate input
    const schema = {
      file_url: { required: true, type: 'string', maxLength: 2048 },
      loss_type: { required: false, type: 'string', maxLength: 100 },
      severity: { required: false, type: 'string', maxLength: 50 },
      areas: { required: false, array: true }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'CN-1000', 400);
    }

    // Sanitize inputs
    const sanitizedFileUrl = sanitizeInput(body.file_url, 2048);
    const sanitizedLossType = body.loss_type ? sanitizeInput(body.loss_type, 100) : null;
    const sanitizedSeverity = body.severity ? sanitizeInput(body.severity, 50) : null;

    // Validate file URL format
    try {
      const url = new URL(sanitizedFileUrl);
      if (url.protocol !== 'https:') {
        return sendError('File URL must use HTTPS protocol', 'CN-1001', 400);
      }
    } catch (e) {
      return sendError('Invalid file URL format', 'CN-1000', 400);
    }

    // Call contractor estimate interpreter
    const estimateInterpreter = require('../../contractor-estimate-interpreter');
    
    const result = await estimateInterpreter.handler({
      ...event,
      body: JSON.stringify({
        fileUrl: body.file_url,
        lossType: body.loss_type,
        severity: body.severity,
        areas: body.areas || [],
        claimId: body.claim_id || `claim-${Date.now()}`
      }),
      httpMethod: 'POST',
      headers: event.headers
    });

    if (result.statusCode !== 200) {
      const errorData = JSON.parse(result.body || '{}');
      return sendError(
        errorData.error || 'Estimate interpretation failed',
        'CN-5003',
        result.statusCode,
        { originalError: errorData.error }
      );
    }

    const interpretationData = JSON.parse(result.body);

    // Trigger timeline and compliance events
    try {
      const supabase = getSupabaseClient();
      if (supabase && userId) {
        const claimId = body.claim_id || `claim-${Date.now()}`;
        
        // Add timeline event
        await supabase
          .from('claim_timeline')
          .insert({
            user_id: userId,
            claim_id: claimId,
            event_type: 'contractor_estimate_interpreted',
            event_date: new Date().toISOString().split('T')[0],
            source: 'api',
            title: 'Contractor Estimate Interpreted',
            description: `Estimate total: $${interpretationData.summary?.totalAmount || 0}`,
            metadata: {
              interpretation_id: interpretationData.id,
              rom_relation: interpretationData.summary?.romRange?.relation
            }
          })
          .catch(err => {
            console.warn('Timeline event creation failed:', err);
          });

        // Trigger compliance check if estimate is below ROM range
        if (interpretationData.summary?.romRange?.relation === 'below-range') {
          const complianceAnalyze = require('../compliance-analyze');
          complianceAnalyze.handler({
            ...event,
            body: JSON.stringify({
              state: body.state || 'CA',
              carrier: body.carrier || '',
              claimType: body.claim_type || 'Property',
              events: [{
                date: new Date().toISOString().split('T')[0],
                name: 'Estimate Below ROM Range',
                description: 'Contractor estimate is below expected ROM range'
              }]
            }),
            httpMethod: 'POST'
          }).catch(err => {
            console.warn('Compliance check trigger failed:', err);
          });
        }
      }
    } catch (error) {
      console.warn('Event trigger failed:', error);
      // Don't fail the request if event trigger fails
    }

    return sendSuccess({
      interpretation_id: interpretationData.id,
      estimate_total: interpretationData.summary?.totalAmount,
      rom_range: interpretationData.summary?.romRange,
      line_items: interpretationData.lineItems || [],
      missing_scope: interpretationData.missingScope || [],
      recommendations: interpretationData.recommendations || [],
      interpreted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Estimate Interpret API Error:', error);
    
    try {
      return sendError('Failed to interpret estimate', 'CN-5000', 500, { errorType: error.name });
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            code: 'CN-9000',
            message: 'Critical system failure'
          }
        })
      };
    }
  }
};


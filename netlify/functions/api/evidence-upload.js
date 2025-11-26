/**
 * API Endpoint: /evidence/upload
 * Uploads evidence file and auto-tags
 */

const { getSupabaseClient, sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId, user } = event;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Validate input
    const schema = {
      file_url: { required: true, type: 'string' },
      file_name: { required: true, type: 'string' },
      file_size: { required: false, type: 'number' },
      mime_type: { required: false, type: 'string' },
      category: { required: false, type: 'string' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'CN-1000', 400);
    }

    // Save to evidence_items table (with sanitized values)
    const { data: evidenceItem, error: insertError } = await supabase
      .from('evidence_items')
      .insert({
        user_id: userId,
        category: sanitizedCategory || 'other',
        file_url: sanitizedFileUrl,
        file_name: sanitizedFileName,
        file_size: body.file_size || 0,
        mime_type: body.mime_type || 'application/octet-stream',
        notes: body.notes ? sanitizeInput(body.notes, 5000) : ''
      })
      .select()
      .single();

    if (insertError) {
      return sendError('Failed to save evidence', 'CN-5001', 500, { databaseError: insertError.message });
    }

    // Auto-categorize if category not provided
    if (!body.category) {
      try {
        const categorizeFunction = require('../../ai-categorize-evidence');
        if (categorizeFunction && categorizeFunction.handler) {
          const categorizeResult = await categorizeFunction.handler({
            ...event,
            body: JSON.stringify({
              file_url: body.file_url,
              file_name: body.file_name,
              mime_type: body.mime_type
            }),
            httpMethod: 'POST',
            headers: event.headers
          });

          if (categorizeResult && categorizeResult.statusCode === 200) {
            const categoryData = JSON.parse(categorizeResult.body || '{}');
            if (categoryData.category) {
              await supabase
                .from('evidence_items')
                .update({ category: categoryData.category })
                .eq('id', evidenceItem.id);
              evidenceItem.category = categoryData.category;
            }
          }
        }
      } catch (error) {
        console.warn('Auto-categorization failed:', error);
        // Continue without categorization
      }
    }

    // Trigger timeline event (via event bus pattern)
    try {
      // This would typically be handled by frontend event-bus.js
      // For API, we can add a timeline event directly
      const supabase = getSupabaseClient();
      if (supabase && userId) {
        const claimId = body.claim_id || `claim-${Date.now()}`;
        await supabase
          .from('claim_timeline')
          .insert({
            user_id: userId,
            claim_id: claimId,
            event_type: 'evidence_uploaded',
            event_date: new Date().toISOString().split('T')[0],
            source: 'api',
            title: `Uploaded ${body.file_name}`,
            description: `File uploaded via API: ${body.file_name}`,
            metadata: {
              evidence_id: evidenceItem.id,
              category: evidenceItem.category
            }
          })
          .catch(err => {
            console.warn('Timeline event creation failed:', err);
          });
      }
    } catch (error) {
      console.warn('Event trigger failed:', error);
      // Don't fail the request if event trigger fails
    }

    return sendSuccess({
      evidence_id: evidenceItem.id,
      file_url: evidenceItem.file_url,
      file_name: evidenceItem.file_name,
      category: evidenceItem.category,
      uploaded_at: evidenceItem.created_at
    }, 201);

  } catch (error) {
    console.error('Evidence Upload API Error:', error);
    
    try {
      return sendError('Failed to upload evidence', 'CN-5000', 500, { errorType: error.name });
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


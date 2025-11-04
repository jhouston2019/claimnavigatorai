const { createClient } = require('@supabase/supabase-js');
const detectDeadline = require('./agent_tools/detect_deadline');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Refresh deadlines by parsing documents and updating claim_dates table
 * @param {string} claimId - Claim ID
 * @returns {Promise<object>} Summary of updates
 */
async function refreshDeadlines(claimId) {
  try {
    let updatedCount = 0;
    let addedCount = 0;

    // Fetch documents from Supabase Storage bucket "claim_docs"
    const { data: files, error: listError } = await supabase.storage
      .from('claim_docs')
      .list(claimId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.warn('Could not list documents:', listError.message);
      // Try alternative path structure
      const { data: altFiles } = await supabase.storage
        .from('claim_docs')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (altFiles) {
        // Filter files for this claim
        files = altFiles.filter(f => f.name.includes(claimId));
      } else {
        files = [];
      }
    }

    // Process each document
    for (const file of files || []) {
      if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        continue;
      }

      try {
        // Download file content
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('claim_docs')
          .download(file.name);

        if (downloadError) {
          console.warn(`Could not download ${file.name}:`, downloadError.message);
          continue;
        }

        // Extract text from file (simplified - in production, use proper PDF parsing)
        let documentText = '';
        if (file.name.endsWith('.txt')) {
          documentText = await fileData.text();
        } else {
          // For PDF, we'd need a PDF parser library
          // For now, skip PDFs or use a text extraction service
          console.warn(`PDF text extraction not implemented for ${file.name}`);
          continue;
        }

        if (!documentText || documentText.trim().length < 50) {
          continue;
        }

        // Detect deadlines using AI
        const deadlineResult = await detectDeadline.detectDeadline(documentText);

        if (!deadlineResult.deadlines || deadlineResult.deadlines.length === 0) {
          continue;
        }

        // Process each detected deadline
        for (const deadline of deadlineResult.deadlines) {
          const deadlineDate = deadline.deadline_date || deadline.due_date;
          const deadlineText = deadline.deadline_text || deadline.text || '';
          const context = deadline.context || deadline.description || '';
          const actionRequired = deadline.action_required || '';
          const priority = deadline.priority || 'Medium';

          if (!deadlineDate) {
            continue;
          }

          // Calculate days from loss date
          const { data: claim } = await supabase
            .from('claims')
            .select('date_of_loss')
            .eq('id', claimId)
            .single();

          let dueDay = null;
          if (claim && claim.date_of_loss) {
            const lossDate = new Date(claim.date_of_loss);
            const dueDate = new Date(deadlineDate);
            dueDay = Math.ceil((dueDate - lossDate) / (1000 * 60 * 60 * 24));
          }

          // Upsert into claim_dates or claim_timeline_deadlines
          const deadlineData = {
            claim_id: claimId,
            deadline_name: deadlineText.substring(0, 200),
            deadline_description: `${context}\n${actionRequired}`.trim(),
            due_date: deadlineDate,
            due_day: dueDay,
            deadline_type: 'custom',
            priority: priority,
            source_document: file.name,
            is_missed: false,
            notes: `Detected from document: ${file.name}`
          };

          // Try claim_timeline_deadlines first
          const { data: existing, error: checkError } = await supabase
            .from('claim_timeline_deadlines')
            .select('id')
            .eq('claim_id', claimId)
            .eq('deadline_name', deadlineData.deadline_name)
            .limit(1)
            .single();

          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('claim_timeline_deadlines')
              .update(deadlineData)
              .eq('id', existing.id);

            if (!updateError) {
              updatedCount++;
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('claim_timeline_deadlines')
              .insert(deadlineData);

            if (!insertError) {
              addedCount++;
            }
          }

          // Also create alerts for deadlines within 7 days
          if (dueDay !== null && dueDay <= 7 && dueDay >= 0) {
            await supabase
              .from('claim_reminders')
              .insert({
                user_id: '', // Will be set from claim context
                claim_id: claimId,
                message: `Deadline approaching: ${deadlineText}`,
                due_date: deadlineDate,
                priority: priority === 'Critical' ? 'Critical' : 'High',
                sent: false
              });
          }
        }

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        continue;
      }
    }

    return {
      status: 'success',
      files_processed: files?.length || 0,
      deadlines_added: addedCount,
      deadlines_updated: updatedCount,
      total_deadlines: addedCount + updatedCount,
      refreshed_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error refreshing deadlines:', error);
    throw new Error(`Failed to refresh deadlines: ${error.message}`);
  }
}

// Export the function for direct import
exports.refreshDeadlines = refreshDeadlines;

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestData = JSON.parse(event.body || '{}');
    const { claim_id } = requestData;

    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id is required' })
      };
    }

    const result = await refreshDeadlines(claim_id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};


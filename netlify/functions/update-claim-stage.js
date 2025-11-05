const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { claim_id, stage_name, new_status } = requestData;

    // Validate required fields
    if (!claim_id || !stage_name || !new_status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: claim_id, stage_name, and new_status are required' 
        })
      };
    }

    // Validate status value
    const validStatuses = ['pending', 'active', 'complete'];
    if (!validStatuses.includes(new_status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        })
      };
    }

    // Update the stage status
    const { data: updatedData, error: updateError } = await supabase
      .from('claim_stages')
      .update({ 
        status: new_status, 
        updated_at: new Date().toISOString() 
      })
      .eq('claim_id', claim_id)
      .eq('stage_name', stage_name)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Supabase error: ${updateError.message}`);
    }

    // Log stage change in claim_journal
    try {
      const { error: journalError } = await supabase
        .from('claim_journal')
        .insert([{
          claim_id,
          user_id: null, // System-generated
          entry_title: `Stage Updated: ${stage_name}`,
          entry_body: `Claim stage "${stage_name}" has been marked as ${new_status} by system or user.`
        }]);

      if (journalError) {
        console.warn('Could not log to claim_journal:', journalError);
        // Continue even if journal logging fails
      }
    } catch (journalErr) {
      console.warn('Error logging to claim_journal:', journalErr);
      // Continue even if journal logging fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        stage: updatedData
      })
    };

  } catch (error) {
    console.error('Error updating claim stage:', error);
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


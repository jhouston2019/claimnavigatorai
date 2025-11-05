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
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const claim_id = event.queryStringParameters?.claim_id;

    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id query parameter is required' })
      };
    }

    // Get claim stages
    const { data, error } = await supabase
      .from('claim_stages')
      .select('*')
      .eq('claim_id', claim_id)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // If no stages exist, create default stages for this claim
    if (!data || data.length === 0) {
      const defaultStages = [
        { stage_name: 'Notice of Loss', description: 'Initial claim notification submitted', order_index: 1, status: 'pending' },
        { stage_name: 'Inspection Scheduled', description: 'Property inspection has been scheduled', order_index: 2, status: 'pending' },
        { stage_name: 'Estimate Received', description: 'Insurance adjuster estimate received', order_index: 3, status: 'pending' },
        { stage_name: 'Negotiation', description: 'Negotiating settlement amount', order_index: 4, status: 'pending' },
        { stage_name: 'Payment', description: 'Settlement payment processed', order_index: 5, status: 'pending' },
        { stage_name: 'Closed', description: 'Claim finalized and closed', order_index: 6, status: 'pending' }
      ];

      const stagesToInsert = defaultStages.map(stage => ({
        claim_id,
        ...stage
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('claim_stages')
        .insert(stagesToInsert)
        .select();

      if (insertError) {
        console.warn('Could not insert default stages:', insertError);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ stages: [] })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ stages: insertedData || [] })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ stages: data || [] })
    };

  } catch (error) {
    console.error('Error getting claim stages:', error);
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


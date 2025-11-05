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

    // Get deadlines
    const { data, error } = await supabase
      .from('claim_dates')
      .select('*')
      .eq('claim_id', claim_id)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (data || []).filter(d => {
      const deadlineDate = new Date(d.date);
      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate >= today;
    });

    const overdue = (data || []).filter(d => {
      const deadlineDate = new Date(d.date);
      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    });

    const highPriority = (data || []).filter(d => d.priority === 'High');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        deadlines: data || [],
        statistics: {
          total: (data || []).length,
          upcoming: upcoming.length,
          overdue: overdue.length,
          high_priority: highPriority.length
        }
      })
    };

  } catch (error) {
    console.error('Error getting deadlines:', error);
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



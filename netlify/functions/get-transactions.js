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

    // Get transactions
    const { data, error } = await supabase
      .from('claim_financials')
      .select('*')
      .eq('claim_id', claim_id)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Calculate totals directly from transactions
    const totals = {
      total_payments: 0,
      total_invoices: 0,
      total_expenses: 0,
      total_supplements: 0,
      total_depreciation: 0,
      total_all: 0,
      total_entries: data?.length || 0
    };

    if (data) {
      data.forEach(txn => {
        const amount = parseFloat(txn.amount) || 0;
        totals.total_all += amount;
        
        switch (txn.entry_type) {
          case 'payment':
            totals.total_payments += amount;
            break;
          case 'invoice':
            totals.total_invoices += amount;
            break;
          case 'expense':
            totals.total_expenses += amount;
            break;
          case 'supplement':
            totals.total_supplements += amount;
            break;
          case 'depreciation':
            totals.total_depreciation += amount;
            break;
        }
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transactions: data || [],
        totals: totals
      })
    };

  } catch (error) {
    console.error('Error getting transactions:', error);
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


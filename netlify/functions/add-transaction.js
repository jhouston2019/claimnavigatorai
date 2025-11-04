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
    const data = JSON.parse(event.body);
    const { claim_id, entry_type, description, source, amount } = data;

    // Validate required fields
    if (!claim_id || !entry_type || !description || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: claim_id, entry_type, description, and amount are required' })
      };
    }

    // Validate entry_type
    const validTypes = ['payment', 'invoice', 'expense', 'supplement', 'depreciation'];
    if (!validTypes.includes(entry_type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Invalid entry_type. Must be one of: ${validTypes.join(', ')}` })
      };
    }

    // Calculate running balance
    const { data: previousEntries } = await supabase
      .from('claim_financials')
      .select('running_balance')
      .eq('claim_id', claim_id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const previousBalance = previousEntries?.running_balance || 0;
    const running_balance = parseFloat(previousBalance) + parseFloat(amount);

    // Insert transaction
    const { data: insertedData, error } = await supabase
      .from('claim_financials')
      .insert([{
        claim_id,
        entry_type,
        description,
        source: source || null,
        amount: parseFloat(amount),
        running_balance,
        date: data.date || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        transaction: insertedData
      })
    };

  } catch (error) {
    console.error('Error adding transaction:', error);
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


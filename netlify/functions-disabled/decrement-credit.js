const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { email } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };
    }

    // Fetch current credits
    const { data: entitlement, error: fetchError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', email)
      .single();

    if (fetchError || !entitlement) {
      console.error('Fetch error:', fetchError);
      return { statusCode: 404, body: JSON.stringify({ error: 'User entitlement not found' }) };
    }

    if (entitlement.credits <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No credits remaining' }) };
    }

    // Decrement credits
    const { data: updated, error: updateError } = await supabase
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', email)
      .select('credits')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update credits' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        credits_remaining: updated.credits
      })
    };

  } catch (err) {
    console.error('decrement-credit error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

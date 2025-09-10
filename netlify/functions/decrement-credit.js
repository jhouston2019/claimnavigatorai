const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email' })
      };
    }

    // Get current credits
    const { data: entitlement, error: fetchError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', email)
      .single();

    if (fetchError || !entitlement) {
      console.error('Entitlement fetch error:', fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Entitlement not found' })
      };
    }

    // Prevent negative credits
    const newCredits = Math.max(0, (entitlement.credits || 0) - 1);

    // Update record
    const { data: updated, error: updateError } = await supabase
      .from('entitlements')
      .update({ credits: newCredits })
      .eq('email', email)
      .select('credits')
      .single();

    if (updateError) {
      console.error('Entitlement update error:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update entitlement' })
      };
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

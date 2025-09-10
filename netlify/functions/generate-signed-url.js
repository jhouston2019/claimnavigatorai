const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const { fileName, userEmail } = JSON.parse(event.body);
    if (!fileName || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileName or userEmail' }),
      };
    }

    // 1. Check entitlements in Supabase
    const { data: entitlement, error } = await supabase
      .from('entitlements')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
    }

    if (!entitlement || entitlement.credits <= 0) {
      return { statusCode: 403, body: 'Access denied. Please purchase first.' };
    }

    // 2. Decrement credits
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Failed to update credits:', updateError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update credits' }) };
    }

    // 3. Generate signed URL from Supabase storage
    const { data: signedUrl, error: signedError } = await supabase
      .storage
      .from('documents') // your storage bucket name
      .createSignedUrl(fileName, 60); // expires in 60 seconds

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create signed URL' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: signedUrl.signedUrl }),
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};

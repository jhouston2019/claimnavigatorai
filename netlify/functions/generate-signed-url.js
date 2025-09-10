const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { fileName, userEmail } = JSON.parse(event.body);

    if (!fileName || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileName or userEmail' }),
      };
    }

    // 1. Check entitlements
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', userEmail)
      .single();

    if (entitlementError) {
      console.error('Entitlement check error:', entitlementError);
      return { statusCode: 500, body: JSON.stringify({ error: 'DB error' }) };
    }

    if (!entitlement || entitlement.credits <= 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Access denied. Please purchase credits first.' }),
      };
    }

    // 2. Decrement credits
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Failed to decrement credits:', updateError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update credits' }) };
    }

    // 3. Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(fileName, 60 * 60);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Signed URL generation failed' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: signedUrlData.signedUrl }),
    };

  } catch (err) {
    console.error('Unhandled error in generate-signed-url:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};

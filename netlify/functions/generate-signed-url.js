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

    const { fileName, email } = JSON.parse(event.body);

    if (!fileName || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fileName or email' }) };
    }

    // 1. Verify entitlement credits > 0
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', email)
      .single();

    if (entitlementError || !entitlement) {
      console.error('Entitlement lookup failed:', entitlementError);
      return { statusCode: 403, body: JSON.stringify({ error: 'Access denied. Please purchase first.' }) };
    }

    if (entitlement.credits <= 0) {
      return { statusCode: 403, body: JSON.stringify({ error: 'No credits remaining' }) };
    }

    // 2. Generate signed URL (15 min expiry)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')  // <-- your Supabase bucket name
      .createSignedUrl(fileName, 900);

    if (urlError || !signedUrl) {
      console.error('Signed URL error:', urlError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate download link' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: signedUrl.signedUrl })
    };

  } catch (err) {
    console.error('generate-signed-url error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { fileName, email } = JSON.parse(event.body);

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileName' })
      };
    }

    console.log(`Generating signed URL for file: ${fileName}, user: ${email}`);

    // Generate a signed URL for the requested document
    const { data, error } = await supabase.storage
      .from('claimnavigatorai-docs')
      .createSignedUrl(fileName, 240); // 240 seconds expiry

    if (error) {
      console.error('Supabase signed URL error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate signed URL' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.signedUrl })
    };

  } catch (err) {
    console.error('generate-signed-url error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

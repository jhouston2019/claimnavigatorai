const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { filePath } = JSON.parse(event.body);

    const { data, error } = await supabase
      .storage
      .from('claimnavigatorai-docs')
      .createSignedUrl(filePath, 60 * 5); // URL expires in 5 min

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.signedUrl })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

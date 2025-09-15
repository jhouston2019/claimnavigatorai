const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { filePath, email } = JSON.parse(event.body);

    if (!filePath || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fileName or email." }) };
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 10); // valid 10 min

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ url: data.signedUrl }) };

  } catch (err) {
    console.error("Signed URL Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate signed URL." }) };
  }
};

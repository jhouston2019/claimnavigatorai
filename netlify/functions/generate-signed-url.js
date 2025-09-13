const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { fileName, email } = JSON.parse(event.body);

    if (!fileName || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fileName or email" }) };
    }

    // Generate a signed URL (valid 5 minutes)
    const { data, error } = await supabase
      .storage
      .from("claimnavigatorai-docs")
      .createSignedUrl(fileName, 60 * 5);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.signedUrl })
    };
  } catch (err) {
    console.error("Signed URL error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate signed URL" }) };
  }
};

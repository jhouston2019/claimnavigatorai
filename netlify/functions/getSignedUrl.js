const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with Service Role key (keep safe!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const { path } = JSON.parse(event.body);

    if (!path) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing file path" })
      };
    }

    // Generate a signed URL for the requested file (valid 5 minutes)
    const { data, error } = await supabase
      .storage
      .from("claimnavigatorai-docs")
      .createSignedUrl(path, 300); // 300 seconds = 5 min

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.signedUrl })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

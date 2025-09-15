const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 1. Verify JWT
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token" }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session" }) };
    }

    // 2. Parse request
    const { filePath } = JSON.parse(event.body || "{}");
    if (!filePath) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing filePath" }) };
    }

    // 3. (Optional) Check ownership in documents table
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id")
      .eq("file_name", filePath.split("/").pop()) // match by filename
      .eq("email", user.email)
      .single();

    if (docError || !doc) {
      return { statusCode: 403, body: JSON.stringify({ error: "You do not have access to this file." }) };
    }

    // 4. Generate signed URL (10 minutes validity)
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60 * 10);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.signedUrl }),
    };

  } catch (err) {
    console.error("Signed URL Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate signed URL." }) };
  }
};

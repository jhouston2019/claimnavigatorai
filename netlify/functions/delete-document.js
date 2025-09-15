const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
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

    // 2. Parse request body
    const { id, fileName } = JSON.parse(event.body || "{}");
    if (!id || !fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing id or fileName" }) };
    }

    // 3. Verify ownership in DB
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id")
      .eq("id", id)
      .eq("email", user.email)
      .single();

    if (docError || !doc) {
      return { statusCode: 403, body: JSON.stringify({ error: "You do not have permission to delete this file." }) };
    }

    // 4. Delete from Supabase storage
    const { error: storageError } = await supabase.storage
      .from("claim-docs")
      .remove([fileName]);

    if (storageError) throw storageError;

    // 5. Delete DB row
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("email", user.email);

    if (dbError) throw dbError;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("delete-document error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to delete document" }) };
  }
};

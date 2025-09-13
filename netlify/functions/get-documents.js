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

    const { email } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email" }) };
    }

    // Get metadata from documents table
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, category, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, docs: data }),
    };
  } catch (err) {
    console.error("Get documents error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch documents" }) };
  }
};

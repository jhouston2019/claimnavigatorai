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

    const { id, fileName } = JSON.parse(event.body);

    if (!id || !fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    // Delete from DB
    await supabase.from("documents").delete().eq("id", id);

    // Delete from storage
    await supabase.storage.from("claimnavigatorai-docs").remove([fileName]);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Delete document error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to delete document" }) };
  }
};

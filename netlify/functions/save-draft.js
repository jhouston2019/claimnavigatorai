const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    // 1. Verify JWT from Authorization header
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token." }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session." }) };
    }

    // 2. Parse request body
    const { content } = JSON.parse(event.body);
    if (!content) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing content." }) };
    }

    // 3. Save draft linked to authenticated user
    const { error: insertError } = await supabase
      .from("drafts")
      .insert({ email: user.email, content });

    if (insertError) {
      console.error("Insert error:", insertError);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to save draft." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("save-draft error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

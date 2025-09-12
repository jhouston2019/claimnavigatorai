const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const { email, content } = JSON.parse(event.body);
    if (!email || !content) return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };

    await supabase.from("drafts").insert({ email, content });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("save-draft error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

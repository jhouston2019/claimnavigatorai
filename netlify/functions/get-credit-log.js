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

    // 2. Fetch logs for authenticated user
    const { data, error } = await supabase
      .from("credit_logs")
      .select("created_at, mode, language, tokens_used")
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, logs: data }),
    };
  } catch (err) {
    console.error("Get credit log error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch logs" }) };
  }
};

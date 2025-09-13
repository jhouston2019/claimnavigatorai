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

    const { data, error } = await supabase
      .from("credit_logs")
      .select("created_at, mode, language, tokens_used")
      .eq("email", email)
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

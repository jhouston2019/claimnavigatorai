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

    const { email, mode, language, tokens_used } = JSON.parse(event.body);

    if (!email || !mode) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const { error } = await supabase
      .from("credit_logs")
      .insert([
        {
          email,
          mode,
          language: language || "en",
          tokens_used: tokens_used || null,
        },
      ]);

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Log credit error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to log credit" }) };
  }
};

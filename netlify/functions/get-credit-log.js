const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Missing email" }) };

    const { data } = await supabase
      .from("credit_logs")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    return { statusCode: 200, body: JSON.stringify({ success: true, logs: data }) };
  } catch (err) {
    console.error("get-credit-log error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

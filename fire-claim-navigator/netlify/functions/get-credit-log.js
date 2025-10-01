const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);

    const { data, error } = await supabase
      .from("credit_logs")
      .select("created_at, mode, language, tokens_used")
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true, logs: data }) };
  } catch (err) {
    console.error("Get credit log error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch logs" }) };
  }
};

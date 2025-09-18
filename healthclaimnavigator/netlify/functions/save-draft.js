const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { content } = JSON.parse(event.body);

    if (!content) return { statusCode: 400, body: JSON.stringify({ error: "Missing content" }) };

    await supabase.from("drafts").insert({ email: user.email, content });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("save-draft error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

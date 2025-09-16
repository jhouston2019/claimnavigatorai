console.log("DEBUG OPENAI KEY:", process.env.OPENAI_API_KEY ? "Loaded" : "MISSING");
console.log("DEBUG SUPABASE URL:", process.env.SUPABASE_URL);
console.log("DEBUG SUPABASE ANON KEY:", process.env.SUPABASE_ANON_KEY ? "Loaded" : "MISSING");

const OpenAI = require("openai");
const { supabase, getUserFromAuth } = require("./utils/auth");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    // ✅ DEV OVERRIDE: hardcode user email while testing
    const user = { email: "test@example.com" };

    const { inputText, language } = JSON.parse(event.body);

    if (!inputText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing inputText" })
      };
    }

    // Check credits
    const { data: entitlement } = await supabase
      .from("entitlements")
      .select("credits")
      .eq("email", user.email)
      .single();

    if (!entitlement || entitlement.credits <= 0) {
      return { statusCode: 403, body: JSON.stringify({ error: "No credits left." }) };
    }

    // Generate draft
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a claims assistant generating professional insurance response letters." },
        { role: "user", content: inputText }
      ]
    });

    const draft = completion.choices[0].message.content;

    // Deduct 1 credit
    await supabase
      .from("entitlements")
      .update({ credits: entitlement.credits - 1 })
      .eq("email", user.email);

    // Log credit usage
    await supabase.from("credit_logs").insert({
      email: user.email,
      mode: "ai-response",
      language,
      tokens_used: 1
    });

    return { statusCode: 200, body: JSON.stringify({ draft }) };
} catch (err) {
  console.error("AI Response Error:", err);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: err.message || "Failed to generate response.",
      stack: err.stack
    })
  };
}
};


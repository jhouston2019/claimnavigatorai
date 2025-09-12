const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const { email, inputText, mode, language = "en" } = JSON.parse(event.body);

    if (!email || !inputText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email or inputText" }) };
    }

    // Check entitlement
    const { data: entitlement } = await supabase
      .from("entitlements")
      .select("credits")
      .eq("email", email)
      .single();

    if (!entitlement || entitlement.credits <= 0) {
      return { statusCode: 403, body: JSON.stringify({ error: "No credits remaining" }) };
    }

    // Generate draft
    const prompt = inputText;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const draft = response.choices[0].message.content;

    // Decrement credit
    await supabase.from("entitlements")
      .update({ credits: entitlement.credits - 1 })
      .eq("email", email);

    // Log usage
    await supabase.from("credit_logs").insert({
      email,
      mode: mode || "ai-agent",
      language,
      tokens_used: response.usage?.total_tokens || null
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ draft, credits_remaining: entitlement.credits - 1 })
    };
  } catch (err) {
    console.error("generate-response error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

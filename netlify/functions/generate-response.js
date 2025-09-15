const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  try {
    const { email, inputText, language } = JSON.parse(event.body);

    if (!email || !inputText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email or inputText" }) };
    }

    // Check entitlement
    const { data: entitlement } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', email)
      .single();

    if (!entitlement || entitlement.credits <= 0) {
      return { statusCode: 403, body: JSON.stringify({ error: "No credits left." }) };
    }

    // Generate AI draft
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
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', email);

    return {
      statusCode: 200,
      body: JSON.stringify({ draft })
    };

  } catch (err) {
    console.error("AI Response Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate response." }) };
  }
};

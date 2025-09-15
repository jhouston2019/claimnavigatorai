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
    // 1. Extract and verify JWT token
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token." }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session." }) };
    }

    const { inputText, language } = JSON.parse(event.body);

    if (!inputText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing inputText" }) };
    }

    // 2. Check entitlement for this verified user
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', user.email)
      .single();

    if (entitlementError || !entitlement) {
      return { statusCode: 403, body: JSON.stringify({ error: "Entitlements not found." }) };
    }

    if (entitlement.credits <= 0) {
      return { statusCode: 403, body: JSON.stringify({ error: "No credits left." }) };
    }

    // 3. Generate AI draft
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a claims assistant generating professional insurance response letters." },
        { role: "user", content: inputText }
      ]
    });

    const draft = completion.choices[0].message.content;

    // 4. Deduct 1 credit
    await supabase
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', user.email);

    return {
      statusCode: 200,
      body: JSON.stringify({ draft })
    };

  } catch (err) {
    console.error("AI Response Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate response." }) };
  }
};

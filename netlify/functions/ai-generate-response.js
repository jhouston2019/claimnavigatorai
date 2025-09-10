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
    const { email, inputText } = JSON.parse(event.body);

    if (!email || !inputText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or inputText' })
      };
    }

    // 1. Check entitlement
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', email)
      .single();

    if (entitlementError || !entitlement) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'No entitlement found for user' })
      };
    }

    if (entitlement.credits <= 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'No credits remaining. Please purchase a top-up.' })
      };
    }

    // 2. Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // cheaper + faster
      messages: [
        {
          role: "system",
          content: "You are a professional insurance claims expert. Write polished, persuasive, and policyholder-focused response letters to insurers."
        },
        {
          role: "user",
          content: inputText
        }
      ],
      max_tokens: 600
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // 3. Decrement credits
    const { data: updated, error: updateError } = await supabase
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to decrement credits:', updateError);
    }

    // 4. Return AI draft
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        draft: aiResponse,
        credits_remaining: updated?.credits ?? entitlement.credits - 1
      })
    };

  } catch (err) {
    console.error('generate-response error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

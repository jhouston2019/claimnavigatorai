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
    const { email, inputText, mode } = JSON.parse(event.body);

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

    // Prevent credit use if it's a summary request
    const requiresCredit = mode !== 'summary';

    if (requiresCredit && entitlement.credits <= 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'No credits remaining. Please purchase a top-up.' })
      };
    }

    // 2. Generate AI response
    const messages = mode === 'summary'
      ? [
          {
            role: "system",
            content: "You are an expert insurance claims analyst. Compare the insurer's letter with the AI draft and summarize the key differences, strengths, and improvements in plain English for the policyholder."
          },
          {
            role: "user",
            content: inputText
          }
        ]
      : [
          {
            role: "system",
            content: "You are a professional insurance claims expert. Write polished, persuasive, and policyholder-focused response letters to insurers."
          },
          {
            role: "user",
            content: inputText
          }
        ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 600
    });

    const aiResponse = completion.choices[0].message.content.trim();

    let creditsRemaining = entitlement.credits;

    // 3. Decrement credits ONLY if not a summary
    if (requiresCredit) {
      const { data: updated, error: updateError } = await supabase
        .from('entitlements')
        .update({ credits: entitlement.credits - 1 })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to decrement credits:', updateError);
      } else {
        creditsRemaining = updated.credits;
      }
    }

    // 4. Return AI draft/summary
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        draft: aiResponse,
        credits_remaining: creditsRemaining
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

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

    // 2. Define mode-specific system prompts
    const prompts = {
      default: "You are a professional insurance claims expert. Write polished, persuasive, and policyholder-focused response letters to insurers.",

      summary: "You are an insurance claims analyst. Provide a plain-English summary of differences, strengths, and weaknesses in the draft vs insurer letter. Do not decrement credits.",

      "reserve-inquiry": "Draft a professional, policyholder-focused letter requesting the insurer disclose the claim reserve amount.",
      "coverage-analyzer": "Analyze the provided insurer coverage letter. Summarize key points, highlight exclusions, and suggest rebuttal arguments in plain English.",
      "supplement-request": "Draft a letter requesting that the insurer include additional scope items or overlooked damage. Do not reference dollar amounts.",
      "pol-checklist": "Provide a checklist of required elements for a valid Proof of Loss form, explained in plain English.",
      "depreciation-release": "Draft a letter requesting release of recoverable depreciation after repairs are complete.",
      "ale-extension": "Draft a letter requesting an extension of Additional Living Expenses (ALE) or temporary housing benefits.",
      "settlement-analyzer": "Analyze the insurer's settlement offer. Summarize what is included, what may be missing, and how the policyholder might respond.",
      "badfaith-checker": "Analyze insurer actions/timeline. Flag potential bad faith issues such as delays, lowball offers, or improper denials.",
      "escalation-drafts": "Draft escalation letters or complaints to supervisors, Department of Insurance, or mediation/arbitration bodies.",
      "timeline-builder": "Convert the provided claim event list into a structured claim timeline highlighting delays and gaps."
    };

    const systemPrompt = prompts[mode] || prompts.default;

    // 3. If this is a normal AI response (no mode, or default), enforce credit check
    let decrementCredit = false;
    if (!mode || mode === "default") {
      if (entitlement.credits <= 0) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'No credits remaining. Please purchase a top-up.' })
        };
      }
      decrementCredit = true;
    }

    // 4. Generate AI output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputText }
      ],
      max_tokens: 600
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // 5. Decrement credits only if it was a "default" AI draft request
    let creditsRemaining = entitlement.credits;
    if (decrementCredit) {
      const { data: updated, error: updateError } = await supabase
        .from('entitlements')
        .update({ credits: entitlement.credits - 1 })
        .eq('email', email)
        .select()
        .single();

      if (!updateError && updated) {
        creditsRemaining = updated.credits;
      } else {
        creditsRemaining = entitlement.credits - 1;
      }
    }

    // 6. Return AI draft
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

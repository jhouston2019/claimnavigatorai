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

    if (entitlement.credits <= 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'No credits remaining. Please purchase a top-up.' })
      };
    }

    // 2. Choose prompt based on mode
    let systemPrompt = "You are a professional insurance claims expert. Write polished, persuasive, and policyholder-focused responses.";
    let userPrompt = inputText;

    switch (mode) {
      case 'reserve-inquiry':
        userPrompt = `Draft a professional Reserve Inquiry Letter asking the insurer to disclose current claim reserves.\n\nContext:\n${inputText}`;
        break;
      case 'coverage-analyzer':
        userPrompt = `Analyze the following insurer coverage letter. Provide a plain-English explanation of coverage decisions, exclusions, and policyholder rebuttal points.\n\nLetter:\n${inputText}`;
        break;
      case 'supplement-request':
        userPrompt = `Draft a Supplement Request Letter asking for additional scope items to be included without dollar amounts.\n\nDetails:\n${inputText}`;
        break;
      case 'pol-checklist':
        userPrompt = `Generate a Proof of Loss Checklist with all required elements based on the following claim context.\n\nContext:\n${inputText}`;
        break;
      case 'depreciation-release':
        userPrompt = `Draft a Recoverable Depreciation Release Letter requesting withheld funds be released after repairs.\n\nClaim Info:\n${inputText}`;
        break;
      case 'ale-extension':
        userPrompt = `Draft an ALE Extension Letter requesting additional living expenses or extended housing coverage.\n\nContext:\n${inputText}`;
        break;
      case 'settlement-analyzer':
        userPrompt = `Analyze the following settlement offer. Provide a plain-English summary of the offer, policyholder risks, and negotiation points.\n\nOffer:\n${inputText}`;
        break;
      case 'badfaith-checker':
        userPrompt = `Review insurer actions/timeline for potential bad faith indicators. Provide a checklist with explanation.\n\nTimeline:\n${inputText}`;
        break;
      case 'escalation-drafts':
        userPrompt = `Generate escalation drafts (supervisor complaint, mediation request, DOI complaint) based on:\n${inputText}`;
        break;
      case 'timeline-builder':
        userPrompt = `Create a structured Claim Timeline highlighting key events, delays, and insurer actions.\n\nEvents:\n${inputText}`;
        break;
      case 'policy-analyzer':
        userPrompt = `Explain the following insurance policy language in plain English. Highlight coverage, exclusions, and ambiguities.\n\nPolicy Text:\n${inputText}`;
        break;
      case 'demand-letter':
        userPrompt = `Draft a persuasive settlement demand letter in professional, policyholder-focused language.\n\nClaim Info:\n${inputText}`;
        break;
      case 'attorney-prep':
        userPrompt = `Summarize this claim into a professional Attorney Prep Sheet with claim overview, damages, insurer position, and next steps.\n\nClaim Data:\n${inputText}`;
        break;
      case 'badfaith-complaint':
        userPrompt = `Draft a Department of Insurance (DOI) Complaint Letter for suspected bad faith insurer conduct.\n\nContext:\n${inputText}`;
        break;
      default:
        // Default: AI Response Agent
        userPrompt = inputText;
        break;
    }

    // 3. Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // 4. Decrement credits
    const { data: updated, error: updateError } = await supabase
      .from('entitlements')
      .update({ credits: entitlement.credits - 1 })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to decrement credits:', updateError);
    }

    // 5. Return AI draft
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

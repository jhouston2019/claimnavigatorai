import OpenAI from "openai";

export const handler = async (event) => {
  try {
    const {
      name,
      policy,
      claim,
      dateOfLoss,
      insurer,
      phone,
      email,
      address,
      insurerOffer,
      contractorEstimate,
      coverageBasis,
      negotiationGoal,
      tone,
    } = JSON.parse(event.body);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `
You are ClaimNavigatorAI, a professional insurance claim negotiation assistant. 
Generate complete, polished negotiation letters that are polite yet assertive.
Always sound knowledgeable about insurance claims and mention key concepts like RCV, ACV, depreciation, or supplements when relevant.
Avoid placeholders. Output a final, send-ready letter only.
`;

    const userPrompt = `
Scenario: ${negotiationGoal}
Tone: ${tone}
Claimant: ${name}
Policy #: ${policy}
Claim #: ${claim}
Date of Loss: ${dateOfLoss}
Insurance Company: ${insurer}
Phone: ${phone}
Email: ${email}
Address: ${address}
Insurer Offer: $${insurerOffer}
Contractor Estimate: $${contractorEstimate}
Coverage Basis: ${coverageBasis}

Write a professional negotiation script or letter for this scenario.
Include logic referencing estimate differences where relevant, 
and end with a courteous request for timely review or resolution.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const script =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Unable to generate negotiation script.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    };
  } catch (error) {
    console.error("Error generating negotiation script:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate negotiation script." }),
    };
  }
};

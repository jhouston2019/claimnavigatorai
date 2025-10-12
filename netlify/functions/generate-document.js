import OpenAI from "openai";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const requestData = JSON.parse(event.body || "{}");
    
    // Handle both old format (documentId, title, fields) and new format (documentType, claimDetails)
    let title, fields;
    
    if (requestData.documentType && requestData.claimDetails) {
      // New format from Situational Advisory
      title = requestData.documentType;
      fields = requestData.claimDetails;
    } else if (requestData.fields && requestData.title) {
      // Old format from Document Generator
      title = requestData.title;
      fields = requestData.fields;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing document data." }),
      };
    }

    const fieldSummary = Object.entries(fields)
      .filter(([key, val]) => val && val.toString().trim() !== '')
      .map(([key, val]) => `${key.replace(/_/g, " ")}: ${val}`)
      .join("\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are an expert public adjuster and claims documentation specialist.
Generate a professional, polished, plain-English version of a "${title}" insurance document
based on the following policyholder data. The result should be concise, clear, and formatted
as an HTML letter with appropriate structure, paragraph breaks, and tone.

If the user input lacks some details, make logical, realistic assumptions to produce a usable draft.
Keep it factual, assertive, and legally polite. Include placeholders for missing values.

Input details:
${fieldSummary}

Output the HTML only (no markdown, no backticks). Use <p> and <h2> tags where appropriate.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional insurance claim letter generator. Output well-formatted HTML documents only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const aiText =
      completion.choices?.[0]?.message?.content ||
      "<p>Unable to generate draft at this time.</p>";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        document: aiText,
        html: aiText,
        documentType: title,
        generatedAt: new Date().toISOString()
      }),
    };
  } catch (err) {
    console.error("AI generation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate document",
        details: err.message,
      }),
    };
  }
};
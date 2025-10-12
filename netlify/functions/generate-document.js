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
    
    // Handle both old format (documentId, title, fields) and new format (topic, formData)
    let topic, formData;
    
    if (requestData.topic && requestData.formData) {
      // New topic-based format
      topic = requestData.topic;
      formData = requestData.formData;
    } else if (requestData.fields && requestData.title) {
      // Old format from Document Generator
      topic = requestData.fields.situationDetails || "General claim assistance needed";
      formData = requestData.fields;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required data. Please provide either topic and formData, or title and fields." }),
      };
    }

    // Determine document type based on topic analysis
    const documentType = determineDocumentType(topic);
    
    // Build the AI prompt
    const prompt = buildAIPrompt(topic, formData, documentType);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are ClaimNavigatorAI, an expert insurance documentation assistant. Generate professional, ready-to-submit insurance claim documents. Use proper formatting with HTML tags for structure. Always include appropriate headers, dates, and signature blocks."
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const aiContent = completion.choices?.[0]?.message?.content || 
      "<p>Unable to generate document at this time. Please try again.</p>";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        documentType: documentType,
        content: aiContent,
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

function determineDocumentType(topic) {
  const topicLower = topic.toLowerCase();
  
  // Appeal and denial related
  if (topicLower.includes('denied') || topicLower.includes('denial') || 
      topicLower.includes('appeal') || topicLower.includes('underpaid') ||
      topicLower.includes('rejected') || topicLower.includes('refused')) {
    return "Appeal Letter";
  }
  
  // Payment and settlement related
  if (topicLower.includes('payment') || topicLower.includes('settlement') || 
      topicLower.includes('final') || topicLower.includes('demand') ||
      topicLower.includes('compensation') || topicLower.includes('reimbursement')) {
    return "Final Settlement Negotiation Letter";
  }
  
  // Delay and timeline issues
  if (topicLower.includes('delay') || topicLower.includes('no response') || 
      topicLower.includes('timeline') || topicLower.includes('exceeded') ||
      topicLower.includes('slow') || topicLower.includes('waiting')) {
    return "Notice of Delay";
  }
  
  // Proof and documentation
  if (topicLower.includes('proof') || topicLower.includes('sworn') || 
      topicLower.includes('inventory') || topicLower.includes('damage list') ||
      topicLower.includes('documentation') || topicLower.includes('evidence')) {
    return "Proof of Loss";
  }
  
  // Business interruption
  if (topicLower.includes('business') || topicLower.includes('interruption') || 
      topicLower.includes('income') || topicLower.includes('revenue') ||
      topicLower.includes('commercial')) {
    return "Business Interruption Claim Presentation";
  }
  
  // Coverage questions
  if (topicLower.includes('coverage') || topicLower.includes('exclusion') || 
      topicLower.includes('policy') || topicLower.includes('covered') ||
      topicLower.includes('excluded')) {
    return "Coverage Clarification Request";
  }
  
  // Appraisal and valuation
  if (topicLower.includes('appraisal') || topicLower.includes('valuation') || 
      topicLower.includes('dispute') || topicLower.includes('disagreement') ||
      topicLower.includes('value') || topicLower.includes('estimate')) {
    return "Appraisal Demand";
  }
  
  // Initial claim filing
  if (topicLower.includes('new claim') || topicLower.includes('first time') || 
      topicLower.includes('initial') || topicLower.includes('report') ||
      topicLower.includes('file claim')) {
    return "Notice of Claim";
  }
  
  // Bad faith
  if (topicLower.includes('bad faith') || topicLower.includes('unfair') || 
      topicLower.includes('deceptive') || topicLower.includes('malicious') ||
      topicLower.includes('intentional')) {
    return "Bad Faith Letter";
  }
  
  // Follow-up
  if (topicLower.includes('follow up') || topicLower.includes('status') || 
      topicLower.includes('update') || topicLower.includes('check') ||
      topicLower.includes('progress')) {
    return "Follow-up Letter";
  }
  
  // Default to general appeal letter
  return "Appeal Letter";
}

function buildAIPrompt(topic, formData, documentType) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const fieldSummary = Object.entries(formData)
    .filter(([key, val]) => val && val.toString().trim() !== '')
    .map(([key, val]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${val}`)
    .join("\n");

  return `You are ClaimNavigatorAI, an insurance documentation assistant.

The user described this claim situation:
"${topic}"

Based on this situation, I need you to generate a professional ${documentType} document.

Use this claim information:
${fieldSummary ? `\nClaim Information:\n${fieldSummary}\n` : ''}

Requirements:
1. Format as a complete, ready-to-submit insurance claim document
2. Include proper letterhead structure with date (${today})
3. Use professional, assertive but polite tone
4. Include all relevant claim details from the information provided
5. Add appropriate legal language and compliance phrasing
6. Include a proper signature block
7. Use HTML formatting with <h2>, <p>, <strong>, and <br> tags for structure
8. Make it specific to the user's situation described in the topic
9. Ensure the document is comprehensive and professional

Generate the complete document now:`;
}
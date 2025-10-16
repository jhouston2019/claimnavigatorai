import OpenAI from "openai";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mode, claim, letter } = req.body;

    // Validate required fields
    if (!letter || !letter.trim()) {
      return res.status(400).json({ 
        error: "Insurer letter is required",
        details: "Please provide the insurer correspondence text for analysis"
      });
    }

    if (!mode) {
      return res.status(400).json({ 
        error: "Analysis mode is required",
        details: "Please select a response mode (reply, appeal, clarify, negotiate, summary)"
      });
    }

    // Define mode-specific prompts
    const modePrompts = {
      reply: "Analyze the insurer letter and draft a professional, evidence-based reply addressing their points. Focus on factual responses and policy compliance.",
      appeal: "Review the insurer's denial and create a formal appeal citing policyholder rights, policy language, and factual support. Include legal precedents where applicable.",
      clarify: "Explain this insurer letter in clear, plain English with a summary of their reasoning and potential next steps for the policyholder.",
      negotiate: "Identify leverage points and propose negotiation counterarguments for the policyholder. Focus on policy language, coverage issues, and settlement opportunities.",
      summary: "Summarize this insurer letter and provide the top three recommended actions for the policyholder."
    };

    // Initialize OpenAI client
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "AI service configuration error",
        details: "OpenAI API key not configured"
      });
    }

    // Prepare the system prompt
    const systemPrompt = `You are a professional insurance claim analyst specializing in policyholder advocacy. Your role is to:

1. Analyze insurer correspondence with expertise in insurance law and policy interpretation
2. Provide accurate, legally appropriate, and clearly structured outputs
3. Focus on policyholder rights and fair claim resolution
4. Generate professional, actionable responses

Guidelines:
- Always maintain a professional tone
- Cite specific policy language when relevant
- Provide actionable next steps
- Identify potential issues or concerns
- Ensure responses are legally appropriate and fact-based
- Structure output as valid JSON with the required fields`;

    // Prepare the user prompt with claim information
    const claimInfo = claim ? Object.entries(claim)
      .filter(([key, value]) => value && value.trim())
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join('\n') : 'No claim information provided';

    const userPrompt = `
ANALYSIS MODE: ${mode.toUpperCase()}

CLAIM INFORMATION:
${claimInfo}

INSURER CORRESPONDENCE:
${letter}

TASK: ${modePrompts[mode]}

Please provide your analysis in the following JSON format:
{
  "analysis": "Detailed analysis and reasoning for the response",
  "issues": ["List of 3-5 key issues or concerns identified"],
  "suggestions": ["List of 3-5 actionable next steps for the policyholder"],
  "draftLetter": "Complete draft response letter ready for review and sending"
}

Ensure the draftLetter is professionally formatted and ready for use.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const responseText = completion.choices[0].message.content;

    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      // Fallback response if JSON parsing fails
      parsedResponse = {
        analysis: responseText,
        issues: ["Unable to parse structured response"],
        suggestions: ["Review the analysis manually", "Consider consulting with a claims professional"],
        draftLetter: responseText
      };
    }

    // Validate and clean the response
    const cleanedResponse = {
      analysis: parsedResponse.analysis || "Analysis completed",
      issues: Array.isArray(parsedResponse.issues) ? parsedResponse.issues : ["Analysis completed"],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : ["Review the correspondence"],
      draftLetter: parsedResponse.draftLetter || parsedResponse.analysis || "Draft response generated"
    };

    // Add metadata
    cleanedResponse.metadata = {
      mode: mode,
      timestamp: new Date().toISOString(),
      model: "gpt-4o-mini"
    };

    return res.status(200).json(cleanedResponse);

  } catch (error) {
    console.error("AI Response Error:", error);
    
    // Handle specific error types
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        error: "AI service quota exceeded",
        details: "Please try again later or contact support"
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({
        error: "AI service configuration error",
        details: "Service configuration issue"
      });
    }

    return res.status(500).json({
      error: "AI processing failed",
      details: error.message || "An unexpected error occurred"
    });
  }
}

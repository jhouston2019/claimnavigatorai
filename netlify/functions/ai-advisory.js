import OpenAI from "openai";

export default async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { situation } = JSON.parse(event.body);
    
    if (!situation || situation.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Situation description is required' })
      };
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback response');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          explanation: `Based on your situation: "${situation}", this appears to be an insurance claim issue that requires immediate attention.`,
          nextSteps: [
            "1. Document everything in writing - keep detailed records of all communications",
            "2. Request a written explanation for any denials or delays",
            "3. Review your policy carefully for applicable coverage",
            "4. Consider consulting with a public adjuster or attorney if needed"
          ],
          recommendedDocument: "Appeal Letter",
          exampleText: "I am writing to formally appeal the decision regarding my insurance claim. I believe this decision was made in error and request a thorough review of my case with proper documentation."
        })
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
    You are Claim Navigator AI, an expert insurance claim advisor with deep knowledge of insurance law, claim processes, and policyholder rights.

    Analyze the following claim situation and provide structured advice in JSON format:
    {
      "explanation": "Clear explanation of the situation and what it means for the policyholder",
      "nextSteps": "Specific, actionable steps the policyholder should take",
      "recommendedDocument": "The most appropriate document type to generate (e.g., Appeal Letter, Demand Letter, Notice of Delay)",
      "exampleText": "A brief example of what the policyholder should say or include in their communication"
    }

    Focus on:
    - Protecting the policyholder's rights
    - Maximizing claim value
    - Following proper claim procedures
    - Citing relevant insurance regulations
    - Providing specific, actionable advice

    Situation: ${situation}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;
    
    // Try to parse the JSON response, fallback to structured text if needed
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      const text = aiResponse;
      structuredResponse = {
        explanation: text.split('\n')[0] || text.substring(0, 200),
        nextSteps: text.split('\n').slice(1).filter(line => line.trim().length > 0).slice(0, 3),
        recommendedDocument: "Appeal Letter", // Default fallback
        exampleText: text.substring(0, 300)
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(structuredResponse)
    };

  } catch (error) {
    console.error('AI Advisory Error:', error);
    
    // Return a fallback response even on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        explanation: "I understand you're dealing with an insurance claim issue. While I'm experiencing technical difficulties, here's some general guidance:",
        nextSteps: [
          "1. Document everything in writing - keep detailed records of all communications",
          "2. Request a written explanation for any denials or delays", 
          "3. Review your policy carefully for applicable coverage",
          "4. Consider consulting with a public adjuster or attorney if needed"
        ],
        recommendedDocument: "Appeal Letter",
        exampleText: "I am writing to formally appeal the decision regarding my insurance claim. I believe this decision was made in error and request a thorough review of my case with proper documentation."
      })
    };
  }
};

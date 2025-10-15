import OpenAI from "openai";

export async function handler(event) {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { situation } = JSON.parse(event.body);
    
    if (!situation || situation.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Situation description is required' })
      };
    }

    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    const prompt = `You are Claim Navigator AI, an expert insurance claim advisor with extensive experience in property, commercial, and catastrophe claims.

Analyze the following claim situation and provide structured advice in JSON format with these exact fields:
{
  "explanation": "Clear explanation of the situation and why the advice is relevant",
  "nextSteps": "Specific actionable steps the claimant should take",
  "recommendedDocument": "The most appropriate document type to generate",
  "exampleText": "Sample text or response the claimant could use"
}

Guidelines:
- Be specific and actionable
- Focus on practical steps the claimant can take
- Recommend the most appropriate document type from: Appeal Letter, Demand Letter, Notice of Delay Complaint, Coverage Clarification Request, Proof of Loss, Damage Assessment, Expert Opinion Request, Business Interruption Claim, etc.
- Provide realistic example text they can adapt
- Consider both immediate actions and longer-term strategy
- Address potential insurance company tactics or objections

Situation: ${situation}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;
    
    // Try to parse the AI response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If parsing fails, wrap the response in a structured format
      parsedResponse = {
        explanation: aiResponse,
        nextSteps: "Review the advice above and take appropriate action.",
        recommendedDocument: "Appeal Letter",
        exampleText: "Contact your insurance company for specific guidance."
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsedResponse)
    };

  } catch (error) {
    console.error('AI Advisory Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to process advisory request',
        details: error.message 
      })
    };
  }
}
import { json, readBody } from './_utils.js';

export default async (req) => {
  try {
    const { situation } = await readBody(req);
    
    if (!situation || situation.trim().length === 0) {
      return json(400, { error: 'Situation description is required' });
    }

    // Use AI to provide situation-specific advice
    const systemPrompt = `You are Claim Navigator AI, an expert insurance claim advisor. Analyze the user's situation and provide specific, actionable advice.

Provide advice in this exact JSON format:
{
  "explanation": "Clear explanation of the situation and what it means for the policyholder",
  "nextSteps": ["Specific step 1", "Specific step 2", "Specific step 3"],
  "recommendedDocument": "The most appropriate document type (e.g., Appeal Letter, Demand Letter, Notice of Delay Complaint)",
  "exampleText": "A brief example of what the policyholder should say"
}

Focus on:
- Protecting the policyholder's rights
- Maximizing claim value
- Following proper claim procedures
- Citing relevant insurance regulations
- Providing specific, actionable advice`;

    const userPrompt = `Analyze this insurance claim situation and provide specific advice:

Situation: ${situation}

Provide situation-specific advice with the most appropriate document type to generate.`;

    const { content } = await openaiChat(systemPrompt, userPrompt);
    
    // Try to parse AI response, fallback to basic if needed
    try {
      const aiResponse = JSON.parse(content);
      return json(200, aiResponse);
    } catch (parseError) {
      // Fallback to basic response
      return json(200, {
        explanation: `Based on your situation: "${situation}", this appears to be an insurance claim issue that requires immediate attention.`,
        nextSteps: [
          "1. Document everything in writing - keep detailed records of all communications",
          "2. Request a written explanation for any denials or delays",
          "3. Review your policy carefully for applicable coverage",
          "4. Consider consulting with a public adjuster or attorney if needed"
        ],
        recommendedDocument: "Appeal Letter",
        exampleText: "I am writing to formally appeal the decision regarding my insurance claim. I believe this decision was made in error and request a thorough review of my case with proper documentation."
      });
    }

  } catch (error) {
    console.error('AI Advisory Error:', error);
    
    return json(200, {
      explanation: "I understand you're dealing with an insurance claim issue. Here's some general guidance:",
      nextSteps: [
        "1. Document everything in writing - keep detailed records of all communications",
        "2. Request a written explanation for any denials or delays", 
        "3. Review your policy carefully for applicable coverage",
        "4. Consider consulting with a public adjuster or attorney if needed"
      ],
      recommendedDocument: "Appeal Letter",
      exampleText: "I am writing to formally appeal the decision regarding my insurance claim. I believe this decision was made in error and request a thorough review of my case with proper documentation."
    });
  }
};

import { json, readBody } from './_utils.js';

export default async (req) => {
  try {
    const { situation } = await readBody(req);
    
    if (!situation || situation.trim().length === 0) {
      return json(400, { error: 'Situation description is required' });
    }

    // Simple response without AI
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

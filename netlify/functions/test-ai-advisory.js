exports.handler = async (event) => {
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

    // Simple test response
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

  } catch (error) {
    console.error('Test AI Advisory Error:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        explanation: "I understand you're dealing with an insurance claim issue. Here's some general guidance:",
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

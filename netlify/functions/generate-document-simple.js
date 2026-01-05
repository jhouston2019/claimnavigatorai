const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { documentType, formData } = JSON.parse(event.body || '{}');

    if (!documentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Document type is required' }),
      };
    }

    // Build the prompt
    const prompt = buildPrompt(documentType, formData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Claim Navigator, an expert insurance documentation assistant. Generate professional, ready-to-submit insurance claim documents. Use proper formatting with HTML tags for structure. Always include appropriate headers, dates, and signature blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        content: generatedContent,
        documentType: documentType,
      }),
    };

  } catch (error) {
    console.error('Error generating document:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate document',
        details: error.message,
      }),
    };
  }
};

function buildPrompt(documentType, formData) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const baseInfo = `
CLAIM INFORMATION:
- Policyholder: ${formData.name || formData.claimantName || 'Not provided'}
- Policy Number: ${formData.policyNumber || 'Not provided'}
- Claim Number: ${formData.claimNumber || 'Not provided'}
- Date of Loss: ${formData.dateOfLoss || 'Not provided'}
- Insurance Company: ${formData.insuranceCompany || formData.insurerName || 'Not provided'}
- Email: ${formData.email || 'Not provided'}
- Phone: ${formData.phone || formData.phoneNumber || 'Not provided'}
- Address: ${formData.address || formData.claimantAddress || 'Not provided'}
`;

  const situationDetails = formData.situationDetails || 'General claim assistance needed';

  return `Generate a professional ${documentType} document based on the following information:

${baseInfo}

SITUATION DETAILS:
${situationDetails}

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
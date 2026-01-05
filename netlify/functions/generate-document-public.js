const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
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
    const body = JSON.parse(event.body || '{}');
    const { content, format = 'pdf', type, filename } = body;

    if (!content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'content is required' })
      };
    }

    // Parse the request body to get claim information
    const { formData } = JSON.parse(event.body || '{}');
    
    // Generate document content with AI
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Claim Navigator, an expert insurance document generator. Create professional, legally sound insurance documents with the following requirements:

CRITICAL REQUIREMENTS:
1. Generate ONLY the actual document content - NO CSS styling, NO template instructions, NO placeholder text like [Insert Date], [Your Name], etc.
2. Include claim information in a professional header format at the top
3. Use clean, professional formatting with proper letter structure
4. Make it ready-to-submit and professional
5. Do NOT include any instructional text, CSS, or template placeholders
6. Do NOT include "Instructions for Use" or any template guidance
7. Do NOT include CSS styling or HTML head elements
8. Focus ONLY on the actual document content that would be submitted
9. Replace ALL placeholders with actual information from the claim data provided
10. Generate a complete, professional document ready for immediate submission

Format as clean HTML with proper structure but NO styling, NO instructions, NO placeholders.`
        },
        {
          role: 'user',
          content: `Generate a professional ${type || 'insurance document'} with the following claim information:

CLAIM INFORMATION:
- Policyholder: ${formData?.name || 'Not provided'}
- Policy Number: ${formData?.policyNumber || 'Not provided'}
- Claim Number: ${formData?.claimNumber || 'Not provided'}
- Date of Loss: ${formData?.dateOfLoss || 'Not provided'}
- Insurance Company: ${formData?.insuranceCompany || 'Not provided'}
- Email: ${formData?.email || 'Not provided'}
- Phone: ${formData?.phone || 'Not provided'}
- Address: ${formData?.address || 'Not provided'}

SITUATION DETAILS:
${content}

Generate a complete, professional document ready for submission.`
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const generatedContent = ai.choices[0].message.content;

    // For demo purposes, return a mock download URL
    // In production, you'd integrate with a real document generation service
    const result = {
      success: true,
      message: 'Document generated successfully',
      filename: filename || `${type || 'document'}_${Date.now()}.${format}`,
      url: `#document-${format}-download`,
      downloadUrl: `#document-${format}-download`,
      content: generatedContent,
      type: format,
      size: '2.3 MB',
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Document generated: ${result.filename}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Document generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Document generation failed: ' + error.message })
    };
  }
};

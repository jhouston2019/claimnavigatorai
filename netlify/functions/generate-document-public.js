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

    // Generate document content with AI
    const ai = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance document generator. Create professional, legally sound insurance documents. Format the output as clean HTML that can be converted to PDF or DOCX.'
        },
        {
          role: 'user',
          content: `Generate a professional ${type || 'insurance document'} based on this content:\n\n${content}`
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

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

    // Demo document generation
    const demoResponse = {
      success: true,
      message: 'Document generated successfully (demo mode)',
      filename: filename || `${type || 'document'}_${Date.now()}.${format}`,
      url: `#demo-${format}-download`,
      downloadUrl: `#demo-${format}-download`,
      type: format,
      size: '2.3 MB',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(demoResponse)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

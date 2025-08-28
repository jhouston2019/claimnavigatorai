const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Get filename from query parameters
  const filename = event.queryStringParameters?.file;
  
  if (!filename) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'File parameter is required' })
    };
  }

  // Security check: ensure filename is safe
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid filename' })
    };
  }

  try {
    // Get file from Netlify Blobs
    const store = getStore("documents");
    const fileBuffer = await store.get(filename);
    
    if (!fileBuffer) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File not found' })
      };
    }

    // Determine content type based on file extension
    const isPDF = filename.toLowerCase().endsWith('.pdf');
    const contentType = isPDF 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    // Return file for download
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600'
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Download error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to download file',
        message: error.message 
      })
    };
  }
};
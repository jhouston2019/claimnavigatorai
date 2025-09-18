exports.handler = async (event) => {
  try {
    console.log('Test function called');
    
    // Get document path from query parameters
    const { documentPath } = event.queryStringParameters || {};
    
    console.log('Document path:', documentPath);
    
    if (!documentPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Document path is required" })
      };
    }

    // Try to fetch from the local Netlify site
    const localUrl = `https://claimnavigatorai.netlify.app/docs/${documentPath}`;
    console.log('Fetching from:', localUrl);
    
    const response = await fetch(localUrl);
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: "Document not found",
          url: localUrl,
          status: response.status
        })
      };
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    console.log('PDF fetched successfully, size:', pdfBuffer.length);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="test-${documentPath.split('/').pop()}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Error in test function:", err);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message,
        stack: err.stack
      })
    };
  }
};

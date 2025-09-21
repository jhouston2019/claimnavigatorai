exports.handler = async (event) => {
  try {
    console.log('Working document function called');
    
    // Get document path from query parameters
    const { documentPath } = event.queryStringParameters || {};
    
    if (!documentPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Document path is required" })
      };
    }

    // Get user email from JWT token or use default
    let userEmail = 'user@claimnavigatorai.com';
    
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload && payload.email) {
            userEmail = payload.email;
          }
        }
      } catch (jwtError) {
        console.log("Could not decode JWT, using default email");
      }
    }
    
    console.log("Serving document for user:", userEmail);

    // Fetch the document directly
    const decodedPath = decodeURIComponent(documentPath);
    const localUrl = `https://claimnavigatorai.com/docs/${decodedPath}`;
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

    // Log the document access for tracking
    console.log(`Document accessed: ${decodedPath} by user: ${userEmail}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${decodedPath.split('/').pop()}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache',
        'X-User-Email': userEmail,
        'X-Document-Path': decodedPath,
        'X-Access-Time': new Date().toISOString()
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Error in working document function:", err);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || "Failed to serve document",
        stack: err.stack
      })
    };
  }
};

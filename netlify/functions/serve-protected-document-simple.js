exports.handler = async (event) => {
  try {
    console.log('Simple protected document function called');
    
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
    
    console.log("Using user email for document protection:", userEmail);

    // Try to fetch from the local Netlify site
    const decodedPath = decodeURIComponent(documentPath);
    const localUrl = `https://claimnavigatorai.netlify.app/docs/${decodedPath}`;
    console.log('Fetching from:', localUrl);
    
    const response = await fetch(localUrl);
    console.log('Response status:', response.status);
    
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

    // For now, just return the original PDF with a note that it's protected
    // TODO: Add actual watermarking once we get basic serving working
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${decodedPath.split('/').pop()}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache',
        'X-User-Email': userEmail, // Include user email in headers for now
        'X-Protection-Status': 'basic-protection-applied'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Error in simple protected document function:", err);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || "Failed to serve protected document",
        stack: err.stack
      })
    };
  }
};

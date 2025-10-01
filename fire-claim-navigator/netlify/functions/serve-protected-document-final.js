const { protectPDF, addPasswordProtection } = require('./utils/pdf-security');

exports.handler = async (event) => {
  try {
    console.log('Protected document function called');
    
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
    
    console.log("Serving protected document for user:", userEmail);

    // Fetch the original document
    const decodedPath = decodeURIComponent(documentPath);
    const localUrl = `${process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com'}/docs/${decodedPath}`;
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

    const originalPdfBuffer = Buffer.from(await response.arrayBuffer());
    console.log('Original PDF fetched, size:', originalPdfBuffer.length);

    // Apply watermarking using the security utility
    console.log('Applying watermark for user:', userEmail);
    const watermarkedPdfBuffer = await protectPDF(originalPdfBuffer, userEmail);
    console.log('PDF watermarked successfully, new size:', watermarkedPdfBuffer.length);

    // Apply password protection
    console.log('Applying password protection for user:', userEmail);
    const ownerPassword = require('crypto').randomBytes(16).toString('hex');
    const userPassword = userEmail;
    
    const protectedPdfBuffer = await addPasswordProtection(watermarkedPdfBuffer, userPassword, ownerPassword);
    console.log('PDF password protected successfully, final size:', protectedPdfBuffer.length);

    // Log the document access for tracking
    console.log(`Protected document accessed: ${decodedPath} by user: ${userEmail}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${decodedPath.split('/').pop()}"`,
        'Content-Length': protectedPdfBuffer.length,
        'Cache-Control': 'no-cache',
        'X-User-Email': userEmail,
        'X-Document-Path': decodedPath,
        'X-Access-Time': new Date().toISOString(),
        'X-Protection-Applied': 'watermark+password',
        'X-User-Password': userEmail
      },
      body: protectedPdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Error in protected document function:", err);
    
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

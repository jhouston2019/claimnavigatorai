const { generateSecurePDF } = require('./utils/pdf-security');
const { getUserFromAuth } = require('./utils/auth');

exports.handler = async (event) => {
  try {
    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Authenticate user
    let user;
    try {
      user = await getUserFromAuth(event);
    } catch (authError) {
      console.error("Authentication error:", authError.message);
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Authentication required" })
      };
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request format" })
      };
    }

    const { content = "This is a test document to verify PDF security features including password protection and watermarking." } = requestData;

    console.log(`Testing PDF security for user: ${user.email}`);

    // Generate secure PDF
    const pdfBuffer = await generateSecurePDF(content, user.email, 'Test Security Document');

    if (pdfBuffer.length === 0) {
      console.error("PDF generation resulted in empty buffer");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to generate PDF content" })
      };
    }

    console.log(`Secure PDF generated successfully. Size: ${pdfBuffer.length} bytes`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="test-secure-document.pdf"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("PDF security test error:", {
      message: err.message,
      stack: err.stack
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || "Failed to test PDF security",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      })
    };
  }
};

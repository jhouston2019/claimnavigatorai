const { generateSecurePDF } = require('./utils/pdf-security');
const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Service configuration error" })
      };
    }

    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parse and validate request body
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

    const { fileName, content } = requestData;

    // Validate required fields
    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "fileName is required and must be a non-empty string" })
      };
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "content is required and must be a non-empty string" })
      };
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') + '.pdf';
    if (sanitizedFileName !== fileName + '.pdf') {
      console.warn(`Filename sanitized: ${fileName} -> ${sanitizedFileName}`);
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

    console.log(`Generating secure PDF document for user: ${user.email}`);

    // Generate secure PDF with password protection and watermarking
    const pdfBuffer = await generateSecurePDF(content, user.email, sanitizedFileName.replace('.pdf', ''));

    if (pdfBuffer.length === 0) {
      console.error("PDF generation resulted in empty buffer");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to generate PDF content" })
      };
    }

    const processingTime = Date.now() - startTime;
    console.log(`PDF generated successfully in ${processingTime}ms. Size: ${pdfBuffer.length} bytes`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Document generation error:", {
      message: err.message,
      stack: err.stack,
      processingTime: `${processingTime}ms`
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || "Failed to generate document",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      })
    };
  }
};

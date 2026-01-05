const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Supabase initialization error:", error.message);
}

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

    const { filePath } = requestData;

    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "filePath is required and must be a non-empty string" })
      };
    }

    // Sanitize file path to prevent directory traversal
    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/\/+/g, '/').trim();
    if (sanitizedPath !== filePath) {
      console.warn(`File path sanitized: ${filePath} -> ${sanitizedPath}`);
    }

    console.log(`Generating signed URL for file: ${sanitizedPath}`);

    // Create signed URL with proper error handling
    const { data, error } = await supabase
      .storage
      .from('Claim Navigator-docs')
      .createSignedUrl(sanitizedPath, 60 * 5); // URL expires in 5 minutes

    if (error) {
      console.error("Supabase storage error:", error.message);
      
      // Handle specific storage errors
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "File not found" })
        };
      }
      
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Storage service error" })
      };
    }

    if (!data || !data.signedUrl) {
      console.error("Invalid response from Supabase storage");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid storage response" })
      };
    }

    const processingTime = Date.now() - startTime;
    console.log(`Signed URL generated successfully in ${processingTime}ms`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: data.signedUrl,
        expires_in: 300, // 5 minutes
        processing_time_ms: processingTime
      })
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Get Document Error:", {
      message: err.message,
      stack: err.stack,
      processingTime: `${processingTime}ms`
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      })
    };
  }
};

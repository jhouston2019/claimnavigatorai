const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase with error handling
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
  try {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database configuration error" })
      };
    }

    // Validate HTTP method
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Method not allowed" })
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

    const { userEmail } = requestData;

    // Validate required fields
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Valid user email is required" })
      };
    }

    console.log(`Fetching appeals for user: ${userEmail}`);

    // Get user appeals from entitlements table
    const { data: entitlement, error: entError } = await supabase
      .from("entitlements")
      .select("appeals")
      .eq("email", userEmail)
      .single();

    if (entError && entError.code !== "PGRST116") {
      // Not just "row not found"
      console.error("Error fetching user appeals:", entError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Database error" })
      };
    }

    const appeals = entitlement?.appeals || [];

    console.log(`Found ${appeals.length} appeals for user: ${userEmail}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        appeals: appeals,
        count: appeals.length
      })
    };

  } catch (err) {
    console.error("Get user appeals error:", {
      message: err.message,
      stack: err.stack
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { 
          details: err.message,
          stack: err.stack 
        })
      })
    };
  }
};

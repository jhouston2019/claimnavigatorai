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

    const { userEmail, appealId, newStatus, notes } = requestData;

    // Validate required fields
    if (!userEmail || !appealId || !newStatus) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "User email, appeal ID, and new status are required" })
      };
    }

    // Validate status
    const validStatuses = ['new', 'submitted', 'pending', 'response_received', 'next_steps'];
    if (!validStatuses.includes(newStatus)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Invalid status. Must be one of: " + validStatuses.join(', ') })
      };
    }

    console.log(`Updating appeal ${appealId} status to ${newStatus} for user: ${userEmail}`);

    // Get current appeals
    const { data: entitlement, error: entError } = await supabase
      .from("entitlements")
      .select("appeals")
      .eq("email", userEmail)
      .single();

    if (entError && entError.code !== "PGRST116") {
      console.error("Error fetching user appeals:", entError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Database error" })
      };
    }

    const appeals = entitlement?.appeals || [];
    const appealIndex = appeals.findIndex(appeal => appeal.appeal_id === appealId);

    if (appealIndex === -1) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Appeal not found" })
      };
    }

    // Update the appeal status
    const updatedAppeals = [...appeals];
    updatedAppeals[appealIndex] = {
      ...updatedAppeals[appealIndex],
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(notes && { notes })
    };

    // Save updated appeals
    const { error: updateError } = await supabase
      .from("entitlements")
      .update({ appeals: updatedAppeals })
      .eq("email", userEmail);

    if (updateError) {
      console.error("Error updating appeal status:", updateError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Failed to update appeal status" })
      };
    }

    console.log(`Appeal ${appealId} status updated to ${newStatus}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        appeal: updatedAppeals[appealIndex]
      })
    };

  } catch (err) {
    console.error("Update appeal status error:", {
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

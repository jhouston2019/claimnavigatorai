const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase configuration missing - using fallback");
    // Create a mock client for development
    supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ eq: () => ({ data: [], error: null }) }),
        delete: () => ({ eq: () => ({ data: [], error: null }) })
      }),
      auth: {
        getUser: () => ({ data: { user: null }, error: null })
      }
    };
  } else {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
} catch (error) {
  console.error("Supabase initialization error in auth utils:", error.message);
  // Fallback mock client
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ eq: () => ({ data: [], error: null }) }),
      delete: () => ({ eq: () => ({ data: [], error: null }) })
    }),
    auth: {
      getUser: () => ({ data: { user: null }, error: null })
    }
  };
}

async function getUserFromAuth(event) {
  try {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Extract authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Extract token from Bearer format
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || token.length === 0) {
      throw new Error("Invalid token format");
    }

    console.log("Authenticating user with token");

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error("Supabase auth error:", error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    console.log(`User authenticated successfully: ${user.email}`);
    return user;

  } catch (error) {
    console.error("Authentication error:", error.message);
    throw error;
  }
}

module.exports = { supabase, getUserFromAuth };

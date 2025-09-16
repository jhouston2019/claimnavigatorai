const OpenAI = require("openai");
const { supabase, getUserFromAuth } = require("./utils/auth");

// Initialize OpenAI with proper error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error("OpenAI initialization error:", error.message);
}

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Service configuration error" })
      };
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database configuration error" })
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

    const { inputText, language } = requestData;

    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "inputText is required and must be a non-empty string" })
      };
    }

    // DEV OVERRIDE: Use hardcoded email for testing, otherwise get from auth
    let user;
    if (process.env.NODE_ENV === 'development') {
      user = { email: "test@example.com" };
      console.log("DEV MODE: Using test email for user authentication");
    } else {
      try {
        user = await getUserFromAuth(event);
      } catch (authError) {
        console.error("Authentication error:", authError.message);
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Authentication required" })
        };
      }
    }

    console.log(`Processing AI request for user: ${user.email}`);

    // Check user credits with proper error handling
    const { data: entitlement, error: entitlementError } = await supabase
      .from("entitlements")
      .select("credits")
      .eq("email", user.email)
      .single();

    if (entitlementError) {
      console.error("Database error checking credits:", entitlementError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database error" })
      };
    }

    if (!entitlement || entitlement.credits <= 0) {
      console.log(`User ${user.email} has no credits remaining`);
      return { 
        statusCode: 403, 
        body: JSON.stringify({ error: "No credits remaining" }) 
      };
    }

    console.log(`User ${user.email} has ${entitlement.credits} credits remaining`);

    // Generate AI response with fallback model
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a professional claims assistant generating insurance response letters. Provide clear, professional, and legally appropriate responses." 
          },
          { role: "user", content: inputText }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError.message);
      
      // Try fallback model if primary fails
      try {
        console.log("Attempting fallback model: gpt-3.5-turbo");
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: "You are a professional claims assistant generating insurance response letters." 
            },
            { role: "user", content: inputText }
          ],
          max_tokens: 1500,
          temperature: 0.7
        });
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError.message);
        return {
          statusCode: 503,
          body: JSON.stringify({ error: "AI service temporarily unavailable" })
        };
      }
    }

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error("Invalid OpenAI response structure");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid AI response" })
      };
    }

    const draft = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;

    console.log(`AI response generated successfully. Tokens used: ${tokensUsed}`);

    // Only deduct credit after successful AI generation
    const { error: updateError } = await supabase
      .from("entitlements")
      .update({ credits: entitlement.credits - 1 })
      .eq("email", user.email);

    if (updateError) {
      console.error("Error updating credits:", updateError.message);
      // Don't fail the request, but log the error
    } else {
      console.log(`Credits updated for ${user.email}: ${entitlement.credits - 1} remaining`);
    }

    // Log credit usage
    const { error: logError } = await supabase.from("credit_logs").insert({
      email: user.email,
      mode: "ai-response",
      language: language || "en",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Request completed in ${processingTime}ms`);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        draft,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("AI Response Error:", {
      message: err.message,
      stack: err.stack,
      processingTime: `${processingTime}ms`
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      })
    };
  }
};


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

// US States list for validation
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const CLAIM_TYPES = ['Property', 'Auto', 'Health', 'Business Interruption', 'Other'];

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Service configuration error" })
      };
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return {
        statusCode: 500,
        headers,
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
        headers,
        body: JSON.stringify({ error: "Invalid request format" })
      };
    }

    const { state, claimType, language = 'en' } = requestData;

    // Validate required fields
    if (!state || typeof state !== 'string' || state.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "State is required and must be a non-empty string" })
      };
    }

    if (!claimType || typeof claimType !== 'string' || claimType.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Claim type is required and must be a non-empty string" })
      };
    }

    // Validate state
    if (!US_STATES.includes(state)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid state. Must be one of the 50 US states." })
      };
    }

    // Validate claim type
    if (!CLAIM_TYPES.includes(claimType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid claim type. Must be one of: Property, Auto, Health, Business Interruption, Other." })
      };
    }

    // Validate language
    if (!['en', 'es'].includes(language)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Language must be 'en' or 'es'" })
      };
    }

    // Authentication check
    let user;
    try {
      user = await getUserFromAuth(event);
    } catch (authError) {
      console.error("Authentication failed:", authError.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Authentication required" })
      };
    }

    // Check user credits (Stripe gate)
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits, subscription_status')
      .eq('user_email', user.email)
      .single();

    if (creditsError) {
      console.error("Error fetching user credits:", creditsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to check user credits" })
      };
    }

    // Check if user has credits or is subscribed
    const hasSubscription = credits?.subscription_status === 'active';
    const hasCredits = credits?.credits > 0;

    if (!hasSubscription && !hasCredits) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ 
          error: "Insufficient credits. Please upgrade your plan or purchase credits.",
          requiresUpgrade: true
        })
      };
    }

    // Generate AI response
    const langText = language === 'es' ? 'Spanish' : 'English';
    const systemPrompt = `You are an expert insurance claims consultant with deep knowledge of state-specific insurance regulations and consumer rights. Provide comprehensive, accurate information about insurance claim rights, deadlines, and regulatory protections.

CRITICAL REQUIREMENTS:
- Provide state-specific information that is accurate and up-to-date
- Include specific timelines, deadlines, and regulatory requirements
- Explain appeal rights and bad faith protections clearly
- Provide actionable information about filing complaints
- Use plain language that consumers can understand
- Always include appropriate disclaimers
- Output in ${langText}

FORMAT REQUIREMENTS:
- Use clear headings and bullet points
- Include specific deadlines and timelines
- Provide contact information for regulatory agencies
- End with appropriate legal disclaimers`;

    const userPrompt = `Provide a plain-language overview of insurance claim rights, deadlines, and regulatory protections for ${state}, focusing on ${claimType} claims.

Include:
1. Standard response timelines for ${claimType} claims in ${state}
2. Appeal rights and procedures
3. Bad faith protections and remedies
4. How to file a Department of Insurance complaint
5. State-specific regulatory requirements
6. Contact information for relevant agencies

Output in ${langText}.
Always end with a disclaimer: "This is AI-generated and may not reflect the latest law. Consult with a qualified attorney for legal advice."`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;

    // Deduct credit if not subscribed
    if (!hasSubscription) {
      await supabase
        .from('user_credits')
        .update({ credits: credits.credits - 1 })
        .eq('user_email', user.email);
    }

    // Log the usage
    await supabase
      .from('credit_log')
      .insert({
        user_email: user.email,
        mode: 'state-rights',
        language: language,
        tokens_used: completion.usage.total_tokens,
        created_at: new Date().toISOString()
      });

    // Store the query and response
    const { error: insertError } = await supabase
      .from('state_rights')
      .insert({
        user_id: user.id,
        state: state,
        claim_type: claimType,
        response: { content: aiResponse, tokens_used: completion.usage.total_tokens },
        lang: language
      });

    if (insertError) {
      console.error("Error storing state rights query:", insertError);
      // Don't fail the request, just log the error
    }

    const processingTime = Date.now() - startTime;
    console.log(`State rights query processed in ${processingTime}ms`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: aiResponse,
        state: state,
        claimType: claimType,
        language: language,
        tokensUsed: completion.usage.total_tokens,
        processingTime: processingTime
      })
    };

  } catch (error) {
    console.error("State rights generation error:", error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: "Failed to generate state rights information",
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    };
  }
};

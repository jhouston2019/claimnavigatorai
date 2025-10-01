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

    const { stage, claimType, language = 'en' } = requestData;

    // Validate required fields
    if (!stage || typeof stage !== 'string' || stage.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "stage is required and must be a non-empty string" })
      };
    }

    if (!claimType || typeof claimType !== 'string' || claimType.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "claimType is required and must be a non-empty string" })
      };
    }

    // Validate stage value
    const validStages = ['filed', 'inspection', 'offer', 'appeal', 'settlement'];
    if (!validStages.includes(stage.toLowerCase())) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` })
      };
    }

    // Validate language
    const validLanguages = ['en', 'es'];
    if (!validLanguages.includes(language.toLowerCase())) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` })
      };
    }

    // DEV OVERRIDE: Use hardcoded email for testing, otherwise get from auth
    let user;
    if (process.env.NODE_ENV === 'development') {
      user = { email: 'dev@claimnavigatorai.com', id: 'dev-user-id' };
    } else {
      try {
        user = await getUserFromAuth(event);
        if (!user) {
          return {
            statusCode: 401,
            body: JSON.stringify({ error: "Authentication required" })
          };
        }
      } catch (authError) {
        console.error("Authentication error:", authError.message);
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Authentication failed" })
        };
      }
    }

    // Generate AI advice using OpenAI
    const systemPrompt = `You are an expert insurance claim advisor. Provide clear, practical advice for a policyholder at the ${stage} stage of a ${claimType} claim.

Output in ${language === 'es' ? 'Spanish' : 'English'}. Be practical, step-by-step, and include what documents to prepare.

Format your response as:
1. **Current Stage Overview** - Brief explanation of what this stage means
2. **Immediate Next Steps** - 3-5 specific actions to take now
3. **Documents to Prepare** - List of documents needed for this stage
4. **Timeline Expectations** - How long this stage typically takes
5. **Red Flags to Watch** - Warning signs to be aware of
6. **Pro Tips** - Expert advice for success

Keep each section concise but actionable. Focus on practical steps the policyholder can take immediately.`;

    const userPrompt = `Provide advice for a policyholder at the ${stage} stage of a ${claimType} claim.`;

    let aiResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      aiResponse = completion.choices[0].message.content;
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError.message);
      
      // Fallback response for development
      if (process.env.NODE_ENV === 'development') {
        aiResponse = `**Development Mode - Stage Advice for ${stage}**

**Current Stage Overview**
This is the ${stage} stage of your ${claimType} claim. This stage involves [stage-specific description].

**Immediate Next Steps**
1. Contact your insurance adjuster
2. Gather required documentation
3. Review your policy coverage
4. Document all communications

**Documents to Prepare**
- Policy documents
- Damage photos
- Receipts and estimates
- Communication records

**Timeline Expectations**
This stage typically takes 2-4 weeks.

**Red Flags to Watch**
- Delays without explanation
- Requests for unnecessary documentation
- Pressure to accept low offers

**Pro Tips**
- Keep detailed records
- Be persistent but professional
- Know your policy rights`;
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "AI service temporarily unavailable" })
        };
      }
    }

    // Store the advice in Supabase (optional - for analytics)
    try {
      const { error: insertError } = await supabase
        .from('claim_stage_tracker')
        .insert({
          user_id: user.id,
          stage: stage.toLowerCase(),
          status: 'in_progress',
          notes: `AI advice generated for ${claimType} claim`
        });

      if (insertError) {
        console.error("Database insert error:", insertError.message);
        // Don't fail the request if database insert fails
      }
    } catch (dbError) {
      console.error("Database error:", dbError.message);
      // Don't fail the request if database insert fails
    }

    const processingTime = Date.now() - startTime;
    console.log(`Stage advice generated in ${processingTime}ms for user ${user.email}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        stage: stage.toLowerCase(),
        claimType: claimType,
        language: language.toLowerCase(),
        advice: aiResponse,
        generatedAt: new Date().toISOString(),
        processingTime: processingTime
      })
    };

  } catch (error) {
    console.error("Unexpected error in getStageAdvice:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? error.message : "An unexpected error occurred"
      })
    };
  }
};

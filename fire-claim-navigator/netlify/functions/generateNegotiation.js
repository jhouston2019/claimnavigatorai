const OpenAI = require("openai");
const { supabase, getUserFromAuth } = require("./utils/auth");
const { z } = require("zod");

// Initialize OpenAI
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error("OpenAI initialization error:", error.message);
}

// Validation schema
const NegotiationSchema = z.object({
  scenarioType: z.enum(['follow-up', 'lowball-counter', 'denial-challenge', 'delay-reminder']),
  context: z.string().min(10).max(2000)
});

// Scenario templates
const scenarioTemplates = {
  'follow-up': {
    title: 'Follow-up Call Script',
    description: 'Professional follow-up on claim status and next steps',
    keyPoints: [
      'Confirm receipt of documents',
      'Request status update',
      'Establish timeline',
      'Document conversation'
    ]
  },
  'lowball-counter': {
    title: 'Lowball Counter Script',
    description: 'Responding to inadequate settlement offers',
    keyPoints: [
      'Acknowledge offer respectfully',
      'Present market evidence',
      'Request justification',
      'Propose fair settlement'
    ]
  },
  'denial-challenge': {
    title: 'Denial Challenge Script',
    description: 'Challenging claim denials with evidence and legal arguments',
    keyPoints: [
      'Reference policy language',
      'Present supporting evidence',
      'Cite relevant case law',
      'Request reconsideration'
    ]
  },
  'delay-reminder': {
    title: 'Delay Reminder Script',
    description: 'Addressing unreasonable delays in claim processing',
    keyPoints: [
      'Reference statutory timelines',
      'Document delay impact',
      'Request expedited processing',
      'Reserve legal rights'
    ]
  }
};

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

    // Get user authentication
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

    console.log(`Processing negotiation script generation for user: ${user.email}`);

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

    const { scenarioType, context } = requestData;

    // Validate input
    const validationResult = NegotiationSchema.safeParse({ scenarioType, context });
    if (!validationResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.errors
        })
      };
    }

    // Check user credits and subscription limits
    const { data: entitlement, error: entitlementError } = await supabase
      .from("entitlements")
      .select("credits, subscription_status")
      .eq("email", user.email)
      .single();

    if (entitlementError) {
      console.error("Database error checking credits:", entitlementError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database error" })
      };
    }

    // Check if user has subscription or free credits
    const isSubscriber = entitlement?.subscription_status === 'active';
    const freeCredits = entitlement?.credits || 0;
    
    if (!isSubscriber && freeCredits <= 0) {
      console.log(`User ${user.email} has no credits remaining`);
      return { 
        statusCode: 403, 
        body: JSON.stringify({ 
          error: "No credits remaining",
          upgradeRequired: true,
          message: "Free users get 2 negotiation scripts per month. Upgrade for unlimited access."
        }) 
      };
    }

    const scenario = scenarioTemplates[scenarioType];
    console.log(`Generating ${scenario.title} for user: ${user.email}`);

    // Generate AI negotiation script
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a professional insurance claims negotiator and communication expert with 20+ years of experience. Your role is to generate effective negotiation scripts and communication templates.

CRITICAL REQUIREMENTS:
- Create professional, persuasive communication scripts
- Include both phone call scripts and email templates
- Use authoritative but respectful tone
- Include specific talking points and responses to common objections
- Provide clear structure with opening, main points, and closing
- Include follow-up actions and next steps
- Ensure scripts are ready to use immediately
- Maintain professional insurance terminology

SCRIPT STRUCTURE:
1. Opening & Introduction
2. Main Discussion Points
3. Objection Handling
4. Closing & Next Steps
5. Email Template
6. Follow-up Actions

QUALITY STANDARDS:
- Every script must be professional and effective
- Include specific language and phrases
- Address common objections and responses
- Provide clear next steps
- Maintain respectful but firm tone
- Include legal references when appropriate` 
          },
          { 
            role: "user", 
            content: `Generate a professional negotiation script for: ${scenario.title}
            
            Scenario: ${scenario.description}
            Context: ${context}
            
            Key points to address: ${scenario.keyPoints.join(', ')}
            
            Provide both a phone call script and an email template. Include responses to common objections and clear next steps.` 
          }
        ],
        max_tokens: 3000,
        temperature: 0.4
      });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError.message);
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "AI service temporarily unavailable" })
      };
    }

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error("Invalid OpenAI response structure");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid AI response" })
      };
    }

    const generatedScript = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    const confidence = 0.88; // Simulated confidence score

    console.log(`Negotiation script generated successfully. Tokens used: ${tokensUsed}`);

    // Extract phone script and email template from generated content
    const phoneScript = extractPhoneScript(generatedScript);
    const emailTemplate = extractEmailTemplate(generatedScript);

    // Save script to database
    const { error: insertError } = await supabase
      .from("negotiations")
      .insert({
        user_email: user.email,
        scenario_type: scenarioType,
        context: context,
        generated_script: generatedScript,
        email_template: emailTemplate,
        phone_script: phoneScript,
        ai_confidence: confidence
      });

    if (insertError) {
      console.error("Error saving negotiation script:", insertError.message);
      // Don't fail the request, but log the error
    }

    // Deduct credit only after successful generation
    if (!isSubscriber) {
      const { error: updateError } = await supabase
        .from("entitlements")
        .update({ credits: freeCredits - 1 })
        .eq("email", user.email);

      if (updateError) {
        console.error("Error updating credits:", updateError.message);
      } else {
        console.log(`Credits updated for ${user.email}: ${freeCredits - 1} remaining`);
      }
    }

    // Log usage
    const { error: logError } = await supabase.from("credit_logs").insert({
      email: user.email,
      mode: "negotiation-script",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Negotiation script generation completed in ${processingTime}ms`);

    // Generate HTML response
    const html = generateNegotiationHTML(scenario, generatedScript, phoneScript, emailTemplate);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        html: html,
        script: generatedScript,
        phone_script: phoneScript,
        email_template: emailTemplate,
        confidence: confidence,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Negotiation Script Error:", {
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

// Helper functions to extract specific content
function extractPhoneScript(content) {
  // This would use more sophisticated parsing in production
  const phoneMatch = content.match(/Phone Script:([\s\S]*?)(?=Email Template:|$)/i);
  return phoneMatch ? phoneMatch[1].trim() : "Phone script not found in generated content";
}

function extractEmailTemplate(content) {
  // This would use more sophisticated parsing in production
  const emailMatch = content.match(/Email Template:([\s\S]*?)(?=Follow-up Actions:|$)/i);
  return emailMatch ? emailMatch[1].trim() : "Email template not found in generated content";
}

function generateNegotiationHTML(scenario, generatedScript, phoneScript, emailTemplate) {
  return `
    <div class="negotiation-script-result">
      <h3>💬 ${scenario.title}</h3>
      <p class="scenario-description">${scenario.description}</p>
      
      <div class="script-content">
        <div class="script-section">
          <h4>📞 Phone Call Script</h4>
          <div class="script-text">${phoneScript}</div>
        </div>
        
        <div class="script-section">
          <h4>📧 Email Template</h4>
          <div class="script-text">${emailTemplate}</div>
        </div>
        
        <div class="script-section">
          <h4>📋 Key Points to Address</h4>
          <ul>
            ${scenario.keyPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
        
        <div class="script-actions">
          <button class="download-btn" onclick="downloadScript()">Download Script</button>
          <button class="download-btn" onclick="downloadEmail()">Download Email</button>
          <button class="download-btn" onclick="saveToDocuments()">Save to Documents</button>
        </div>
      </div>
    </div>
  `;
}

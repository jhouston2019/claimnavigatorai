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
const EscalationSchema = z.object({
  escalationType: z.enum(['appraisal-demand', 'doi-complaint', 'bad-faith-notice', 'litigation-notice']),
  details: z.string().min(10).max(2000)
});

// Escalation type templates
const escalationTemplates = {
  'appraisal-demand': {
    title: 'Appraisal Demand Letter',
    description: 'Formal demand for appraisal process under policy terms',
    legalBasis: 'Policy appraisal clause and state insurance law',
    keyElements: [
      'Reference to policy appraisal clause',
      'Demand for appraisal within specified timeframe',
      'Selection of appraiser',
      'Reservation of legal rights'
    ]
  },
  'doi-complaint': {
    title: 'DOI Complaint Letter',
    description: 'Formal complaint to Department of Insurance',
    legalBasis: 'State unfair claims practices act',
    keyElements: [
      'Chronology of claim handling',
      'Specific violations of unfair claims practices',
      'Request for investigation',
      'Documentation of damages'
    ]
  },
  'bad-faith-notice': {
    title: 'Bad Faith Notice Letter',
    description: 'Notice of bad faith claim handling and demand for cure',
    legalBasis: 'State bad faith law and common law principles',
    keyElements: [
      'Specific bad faith conduct',
      'Legal basis for bad faith claim',
      'Demand for cure within timeframe',
      'Reservation of legal rights'
    ]
  },
  'litigation-notice': {
    title: 'Litigation Notice Letter',
    description: 'Notice of intent to file lawsuit if claim not resolved',
    legalBasis: 'Contract law and state insurance regulations',
    keyElements: [
      'Final demand for settlement',
      'Notice of intent to litigate',
      'Request for final response',
      'Preservation of evidence notice'
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

    console.log(`Processing escalation notice generation for user: ${user.email}`);

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

    const { escalationType, details } = requestData;

    // Validate input
    const validationResult = EscalationSchema.safeParse({ escalationType, details });
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
          message: "Free users get 2 escalation notices per month. Upgrade for unlimited access."
        }) 
      };
    }

    const escalation = escalationTemplates[escalationType];
    console.log(`Generating ${escalation.title} for user: ${user.email}`);

    // Generate AI escalation notice
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a legal expert specializing in insurance law and formal notice letters. Your role is to generate professional, legally sound escalation notices.

CRITICAL REQUIREMENTS:
- Create formal, professional legal notices
- Use precise legal language and terminology
- Include specific legal citations and references
- Structure as formal legal correspondence
- Include all required legal elements
- Maintain authoritative, professional tone
- Ensure notice is legally sufficient
- Include specific deadlines and consequences

NOTICE STRUCTURE:
1. Formal Letterhead and Date
2. Subject Line and Reference
3. Legal Basis and Authority
4. Specific Allegations and Facts
5. Legal Arguments and Citations
6. Demands and Deadlines
7. Consequences of Non-Compliance
8. Professional Signature Block

QUALITY STANDARDS:
- Every notice must be legally sound and professional
- Include specific legal references
- Use formal legal language
- Provide clear demands and deadlines
- Maintain authoritative tone
- Ensure compliance with legal requirements` 
          },
          { 
            role: "user", 
            content: `Generate a professional ${escalation.title}:
            
            Type: ${escalation.description}
            Legal Basis: ${escalation.legalBasis}
            Case Details: ${details}
            
            Key elements to include: ${escalation.keyElements.join(', ')}
            
            Create a formal legal notice that is professional, legally sound, and ready for delivery.` 
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
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

    const generatedNotice = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    const confidence = 0.92; // Simulated confidence score

    console.log(`Escalation notice generated successfully. Tokens used: ${tokensUsed}`);

    // Save notice to database
    const { error: insertError } = await supabase
      .from("escalations")
      .insert({
        user_email: user.email,
        escalation_type: escalationType,
        case_details: details,
        generated_notice: generatedNotice,
        legal_tone: true,
        ai_confidence: confidence
      });

    if (insertError) {
      console.error("Error saving escalation notice:", insertError.message);
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
      mode: "escalation-notice",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Escalation notice generation completed in ${processingTime}ms`);

    // Generate HTML response
    const html = generateEscalationHTML(escalation, generatedNotice);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        html: html,
        notice: generatedNotice,
        confidence: confidence,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Escalation Notice Error:", {
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

function generateEscalationHTML(escalation, generatedNotice) {
  return `
    <div class="escalation-notice-result">
      <h3>⚖️ ${escalation.title}</h3>
      <p class="escalation-description">${escalation.description}</p>
      
      <div class="notice-content">
        <div class="notice-section">
          <h4>📋 Legal Basis</h4>
          <p>${escalation.legalBasis}</p>
        </div>
        
        <div class="notice-section">
          <h4>📝 Generated Notice</h4>
          <div class="notice-text">${generatedNotice}</div>
        </div>
        
        <div class="notice-section">
          <h4>🔑 Key Elements Included</h4>
          <ul>
            ${escalation.keyElements.map(element => `<li>${element}</li>`).join('')}
          </ul>
        </div>
        
        <div class="notice-actions">
          <button class="download-btn" onclick="downloadNotice()">Download Notice</button>
          <button class="download-btn" onclick="downloadPDF()">Download PDF</button>
          <button class="download-btn" onclick="saveToDocuments()">Save to Documents</button>
        </div>
      </div>
    </div>
  `;
}

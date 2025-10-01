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
const StateRightsSchema = z.object({
  state: z.string().min(2).max(2),
  claimType: z.enum(['property', 'auto', 'health', 'disability'])
});

// State-specific data (in production, this would be in a database)
const stateData = {
  'CA': {
    name: 'California',
    unfairClaimsAct: 'California Insurance Code Section 790.03',
    timeLimits: {
      property: '2 years from date of loss',
      auto: '2 years from date of loss',
      health: '3 years from date of service',
      disability: '3 years from date of disability'
    },
    doiComplaint: 'California Department of Insurance',
    specialProvisions: [
      'Right to appraisal within 2 years',
      'Bad faith penalties up to 3x damages',
      'Mandatory mediation for disputes over $10,000'
    ]
  },
  'TX': {
    name: 'Texas',
    unfairClaimsAct: 'Texas Insurance Code Chapter 541',
    timeLimits: {
      property: '2 years from date of loss',
      auto: '2 years from date of loss',
      health: '2 years from date of service',
      disability: '2 years from date of disability'
    },
    doiComplaint: 'Texas Department of Insurance',
    specialProvisions: [
      'Right to appraisal within 2 years',
      'Bad faith damages up to 3x actual damages',
      'Prompt payment penalties for late payments'
    ]
  },
  'FL': {
    name: 'Florida',
    unfairClaimsAct: 'Florida Statutes Section 624.155',
    timeLimits: {
      property: '5 years from date of loss',
      auto: '4 years from date of loss',
      health: '2 years from date of service',
      disability: '2 years from date of disability'
    },
    doiComplaint: 'Florida Office of Insurance Regulation',
    specialProvisions: [
      'Right to appraisal within 5 years',
      'Bad faith damages up to 3x actual damages',
      'Mandatory mediation for hurricane claims'
    ]
  },
  'NY': {
    name: 'New York',
    unfairClaimsAct: 'New York Insurance Law Section 2601',
    timeLimits: {
      property: '6 years from date of loss',
      auto: '3 years from date of loss',
      health: '3 years from date of service',
      disability: '3 years from date of disability'
    },
    doiComplaint: 'New York State Department of Financial Services',
    specialProvisions: [
      'Right to appraisal within 6 years',
      'Bad faith damages up to 2x actual damages',
      'Mandatory arbitration for disputes over $5,000'
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

    console.log(`Processing state rights query for user: ${user.email}`);

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

    const { state, claimType } = requestData;

    // Validate input
    const validationResult = StateRightsSchema.safeParse({ state, claimType });
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
          message: "Free users get 2 state rights queries per month. Upgrade for unlimited access."
        }) 
      };
    }

    // Get state data
    const stateInfo = stateData[state];
    if (!stateInfo) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "State not supported" })
      };
    }

    console.log(`Checking rights for ${stateInfo.name} - ${claimType} claims`);

    // Generate AI-enhanced analysis
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a legal expert specializing in insurance law and consumer rights. Your role is to provide comprehensive information about state-specific insurance rights and deadlines.

CRITICAL REQUIREMENTS:
- Provide accurate, up-to-date legal information
- Explain complex legal concepts in plain language
- Highlight key deadlines and time limits
- Explain the unfair claims practices act for the state
- Provide specific steps for filing DOI complaints
- Include relevant case law and precedents when helpful
- Structure information clearly with headings and bullet points
- Provide actionable next steps for policyholders

INFORMATION TO INCLUDE:
1. Statutory Time Limits
2. Unfair Claims Practices Act Details
3. DOI Complaint Process
4. Special State Provisions
5. Legal Remedies Available
6. Recommended Actions

QUALITY STANDARDS:
- Every response must be accurate and professional
- Use clear, accessible language
- Provide specific legal references
- Include actionable recommendations
- Maintain objective, informative tone` 
          },
          { 
            role: "user", 
            content: `Provide comprehensive information about ${claimType} insurance rights and deadlines in ${stateInfo.name}. Include statutory time limits, unfair claims practices act details, DOI complaint process, and any special state provisions.` 
          }
        ],
        max_tokens: 2500,
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

    const aiAnalysis = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;

    console.log(`State rights analysis generated successfully. Tokens used: ${tokensUsed}`);

    // Prepare response data
    const responseData = {
      statutory_timelines: {
        claim_filing: stateInfo.timeLimits[claimType],
        proof_of_loss: "30 days from request",
        appraisal: "60 days from demand"
      },
      unfair_claims_highlights: {
        act: stateInfo.unfairClaimsAct,
        key_provisions: stateInfo.specialProvisions
      },
      doi_complaint_process: {
        department: stateInfo.doiComplaint,
        steps: [
          "1. Gather all relevant documentation",
          "2. Complete DOI complaint form",
          "3. Submit complaint online or by mail",
          "4. Follow up within 30 days"
        ]
      }
    };

    // Save query to database
    const { error: insertError } = await supabase
      .from("state_rights")
      .insert({
        user_email: user.email,
        state: state,
        claim_type: claimType,
        query_text: `State rights query for ${stateInfo.name} - ${claimType} claims`,
        response_data: responseData,
        statutory_timelines: responseData.statutory_timelines,
        unfair_claims_highlights: responseData.unfair_claims_highlights,
        doi_complaint_process: responseData.doi_complaint_process
      });

    if (insertError) {
      console.error("Error saving state rights query:", insertError.message);
      // Don't fail the request, but log the error
    }

    // Deduct credit only after successful analysis
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
      mode: "state-rights",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`State rights analysis completed in ${processingTime}ms`);

    // Generate HTML response
    const html = generateStateRightsHTML(stateInfo, claimType, responseData, aiAnalysis);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        html: html,
        data: responseData,
        ai_analysis: aiAnalysis,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("State Rights Error:", {
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

function generateStateRightsHTML(stateInfo, claimType, responseData, aiAnalysis) {
  return `
    <div class="state-rights-result">
      <h3>⚖️ ${stateInfo.name} - ${claimType.charAt(0).toUpperCase() + claimType.slice(1)} Claims Rights</h3>
      
      <div class="rights-content">
        <div class="rights-section">
          <h4>⏰ Statutory Time Limits</h4>
          <ul>
            <li><strong>Claim Filing:</strong> ${responseData.statutory_timelines.claim_filing}</li>
            <li><strong>Proof of Loss:</strong> ${responseData.statutory_timelines.proof_of_loss}</li>
            <li><strong>Appraisal:</strong> ${responseData.statutory_timelines.appraisal}</li>
          </ul>
        </div>
        
        <div class="rights-section">
          <h4>📋 Unfair Claims Practices Act</h4>
          <p><strong>Act:</strong> ${responseData.unfair_claims_highlights.act}</p>
          <h5>Key Provisions:</h5>
          <ul>
            ${responseData.unfair_claims_highlights.key_provisions.map(provision => `<li>${provision}</li>`).join('')}
          </ul>
        </div>
        
        <div class="rights-section">
          <h4>🏛️ DOI Complaint Process</h4>
          <p><strong>Department:</strong> ${responseData.doi_complaint_process.department}</p>
          <h5>Steps to File Complaint:</h5>
          <ol>
            ${responseData.doi_complaint_process.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
        
        <div class="rights-section">
          <h4>🤖 AI Legal Analysis</h4>
          <div class="ai-analysis">${aiAnalysis}</div>
        </div>
        
        <div class="rights-actions">
          <button class="download-btn" onclick="downloadRightsInfo()">Download Rights Summary</button>
          <button class="download-btn" onclick="saveToDocuments()">Save to Documents</button>
        </div>
      </div>
    </div>
  `;
}

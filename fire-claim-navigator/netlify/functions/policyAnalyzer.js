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
const PolicyAnalyzerSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string().min(1)
});

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

    console.log(`Processing policy analysis for user: ${user.email}`);

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
          message: "Free users get 2 policy analyses per month. Upgrade for unlimited access."
        }) 
      };
    }

    // Parse multipart form data
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Content-Type must be multipart/form-data" })
      };
    }

    // For now, we'll simulate file processing since parsing multipart is complex
    // In production, you'd use a library like 'formidable' or 'busboy'
    const fileName = "policy_document.pdf"; // This would come from the actual file upload
    const fileSize = 1024000; // This would come from the actual file
    const fileType = "application/pdf";

    // Validate input
    const validationResult = PolicyAnalyzerSchema.safeParse({
      fileName,
      fileSize,
      fileType
    });

    if (!validationResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.errors
        })
      };
    }

    console.log(`Analyzing policy: ${fileName} (${fileSize} bytes)`);

    // Generate AI analysis
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a certified insurance policy analyst with 20+ years of experience. Your role is to analyze insurance policies and provide comprehensive summaries.

CRITICAL REQUIREMENTS:
- Analyze coverage limits, exclusions, deadlines, and endorsements
- Identify unclear or ambiguous sections that need review
- Highlight potential coverage gaps or limitations
- Provide specific policy language references
- Flag sections that may require legal interpretation
- Structure analysis with clear headings and bullet points
- Use professional insurance terminology
- Provide actionable recommendations

ANALYSIS STRUCTURE:
1. Executive Summary
2. Coverage Limits Analysis
3. Exclusions Review
4. Deadlines & Timelines
5. Endorsements & Riders
6. Flagged Sections for Review
7. Recommendations

QUALITY STANDARDS:
- Every analysis must be comprehensive and professional
- Flag any unclear or ambiguous language
- Provide specific policy section references
- Include actionable next steps
- Maintain objective, analytical tone` 
          },
          { 
            role: "user", 
            content: `Please analyze this insurance policy document. Focus on coverage limits, exclusions, deadlines, and any sections that may need clarification or legal review.` 
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

    const analysis = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    const confidence = 0.85; // Simulated confidence score

    console.log(`Policy analysis generated successfully. Tokens used: ${tokensUsed}`);

    // Parse analysis to extract structured data
    const coverageLimits = extractCoverageLimits(analysis);
    const exclusions = extractExclusions(analysis);
    const deadlines = extractDeadlines(analysis);
    const endorsements = extractEndorsements(analysis);
    const flaggedSections = extractFlaggedSections(analysis);

    // Save analysis to database
    const { error: insertError } = await supabase
      .from("policy_analyses")
      .insert({
        user_email: user.email,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        analysis_summary: analysis,
        coverage_limits: coverageLimits,
        exclusions: exclusions,
        deadlines: deadlines,
        endorsements: endorsements,
        flagged_sections: flaggedSections,
        ai_confidence: confidence
      });

    if (insertError) {
      console.error("Error saving policy analysis:", insertError.message);
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
      mode: "policy-analyzer",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Policy analysis completed in ${processingTime}ms`);

    // Generate HTML response
    const html = generateAnalysisHTML(analysis, coverageLimits, exclusions, deadlines, flaggedSections);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        html: html,
        analysis: analysis,
        coverage_limits: coverageLimits,
        exclusions: exclusions,
        deadlines: deadlines,
        flagged_sections: flaggedSections,
        confidence: confidence,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Policy Analyzer Error:", {
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

// Helper functions to extract structured data from analysis
function extractCoverageLimits(analysis) {
  // This would use more sophisticated parsing in production
  return {
    dwelling: "Extract from analysis",
    personal_property: "Extract from analysis",
    loss_of_use: "Extract from analysis",
    liability: "Extract from analysis"
  };
}

function extractExclusions(analysis) {
  return {
    water_damage: "Extract from analysis",
    mold: "Extract from analysis",
    wear_tear: "Extract from analysis"
  };
}

function extractDeadlines(analysis) {
  return {
    claim_filing: "Extract from analysis",
    proof_of_loss: "Extract from analysis",
    appraisal: "Extract from analysis"
  };
}

function extractEndorsements(analysis) {
  return {
    flood_coverage: "Extract from analysis",
    earthquake: "Extract from analysis",
    jewelry: "Extract from analysis"
  };
}

function extractFlaggedSections(analysis) {
  return [
    "Section requiring legal review",
    "Ambiguous language identified",
    "Potential coverage gap"
  ];
}

function generateAnalysisHTML(analysis, coverageLimits, exclusions, deadlines, flaggedSections) {
  return `
    <div class="policy-analysis-result">
      <h3>📋 Policy Analysis Complete</h3>
      <div class="analysis-content">
        <div class="analysis-section">
          <h4>📊 Coverage Limits</h4>
          <ul>
            <li><strong>Dwelling:</strong> ${coverageLimits.dwelling}</li>
            <li><strong>Personal Property:</strong> ${coverageLimits.personal_property}</li>
            <li><strong>Loss of Use:</strong> ${coverageLimits.loss_of_use}</li>
            <li><strong>Liability:</strong> ${coverageLimits.liability}</li>
          </ul>
        </div>
        
        <div class="analysis-section">
          <h4>⚠️ Key Exclusions</h4>
          <ul>
            <li><strong>Water Damage:</strong> ${exclusions.water_damage}</li>
            <li><strong>Mold:</strong> ${exclusions.mold}</li>
            <li><strong>Wear & Tear:</strong> ${exclusions.wear_tear}</li>
          </ul>
        </div>
        
        <div class="analysis-section">
          <h4>⏰ Important Deadlines</h4>
          <ul>
            <li><strong>Claim Filing:</strong> ${deadlines.claim_filing}</li>
            <li><strong>Proof of Loss:</strong> ${deadlines.proof_of_loss}</li>
            <li><strong>Appraisal:</strong> ${deadlines.appraisal}</li>
          </ul>
        </div>
        
        <div class="analysis-section">
          <h4>🚩 Flagged for Review</h4>
          <ul>
            ${flaggedSections.map(section => `<li>${section}</li>`).join('')}
          </ul>
        </div>
        
        <div class="analysis-section">
          <h4>📝 Full Analysis</h4>
          <div class="analysis-text">${analysis}</div>
        </div>
        
        <div class="analysis-actions">
          <button class="download-btn" onclick="downloadAnalysis()">Download Analysis</button>
          <button class="download-btn" onclick="saveToDocuments()">Save to Documents</button>
        </div>
      </div>
    </div>
  `;
}

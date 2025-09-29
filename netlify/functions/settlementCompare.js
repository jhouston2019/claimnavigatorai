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
const SettlementCompareSchema = z.object({
  insurerOffer: z.number().positive(),
  contractorEstimate: z.number().positive(),
  romEstimate: z.number().positive().optional()
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

    console.log(`Processing settlement comparison for user: ${user.email}`);

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

    const { insurerOffer, contractorEstimate, romEstimate } = requestData;

    // Validate input
    const validationResult = SettlementCompareSchema.safeParse({ 
      insurerOffer, 
      contractorEstimate, 
      romEstimate 
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
          message: "Free users get 2 settlement comparisons per month. Upgrade for unlimited access."
        }) 
      };
    }

    console.log(`Comparing settlement: Insurer $${insurerOffer} vs Contractor $${contractorEstimate}`);

    // Calculate differences
    const contractorDifference = ((contractorEstimate - insurerOffer) / contractorEstimate) * 100;
    const romDifference = romEstimate ? ((romEstimate - insurerOffer) / romEstimate) * 100 : null;
    
    // Determine ROM range if not provided
    const romRange = romEstimate ? {
      low: romEstimate * 0.9,
      high: romEstimate * 1.1
    } : {
      low: contractorEstimate * 0.85,
      high: contractorEstimate * 1.15
    };

    // Generate AI analysis
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are an expert insurance claims adjuster and settlement negotiator with 20+ years of experience. Your role is to analyze settlement offers and provide professional recommendations.

CRITICAL REQUIREMENTS:
- Analyze the fairness of settlement offers compared to market estimates
- Provide specific percentage differences and their significance
- Explain the implications of lowball offers
- Recommend negotiation strategies
- Highlight potential legal remedies for unfair settlements
- Provide actionable next steps for policyholders
- Use professional, authoritative tone
- Include specific dollar amounts and percentages

ANALYSIS STRUCTURE:
1. Settlement Analysis Summary
2. Percentage Difference Breakdown
3. Market Comparison
4. Negotiation Recommendations
5. Legal Options
6. Next Steps

QUALITY STANDARDS:
- Every analysis must be specific and actionable
- Include exact percentage differences
- Provide clear recommendations
- Explain legal implications
- Maintain professional, objective tone` 
          },
          { 
            role: "user", 
            content: `Analyze this settlement comparison:
            - Insurer Offer: $${insurerOffer.toLocaleString()}
            - Contractor Estimate: $${contractorEstimate.toLocaleString()}
            ${romEstimate ? `- ROM Estimate: $${romEstimate.toLocaleString()}` : ''}
            
            The insurer offer is ${contractorDifference.toFixed(1)}% below the contractor estimate${romEstimate ? ` and ${romDifference.toFixed(1)}% below the ROM estimate` : ''}. Provide a professional analysis and recommendations.` 
          }
        ],
        max_tokens: 2000,
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

    console.log(`Settlement comparison analysis generated successfully. Tokens used: ${tokensUsed}`);

    // Prepare recommendation
    let recommendation = "Accept the offer";
    if (contractorDifference > 20) {
      recommendation = "Strongly recommend negotiation - offer is significantly below market value";
    } else if (contractorDifference > 10) {
      recommendation = "Recommend negotiation - offer is below market value";
    } else if (contractorDifference > 5) {
      recommendation = "Consider negotiation - offer is slightly below market value";
    }

    // Save comparison to database
    const { error: insertError } = await supabase
      .from("settlement_comparisons")
      .insert({
        user_email: user.email,
        insurer_offer: insurerOffer,
        contractor_estimate: contractorEstimate,
        rom_estimate: romEstimate,
        rom_range: romRange,
        percentage_difference: contractorDifference,
        ai_summary: aiAnalysis,
        recommendation: recommendation
      });

    if (insertError) {
      console.error("Error saving settlement comparison:", insertError.message);
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
      mode: "settlement-comparison",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Settlement comparison completed in ${processingTime}ms`);

    // Generate HTML response
    const html = generateComparisonHTML(insurerOffer, contractorEstimate, romEstimate, contractorDifference, romDifference, aiAnalysis, recommendation);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        html: html,
        analysis: aiAnalysis,
        percentage_difference: contractorDifference,
        recommendation: recommendation,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Settlement Compare Error:", {
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

function generateComparisonHTML(insurerOffer, contractorEstimate, romEstimate, contractorDifference, romDifference, aiAnalysis, recommendation) {
  const maxValue = Math.max(insurerOffer, contractorEstimate, romEstimate || 0);
  const insurerHeight = (insurerOffer / maxValue) * 200;
  const contractorHeight = (contractorEstimate / maxValue) * 200;
  const romHeight = romEstimate ? (romEstimate / maxValue) * 200 : 0;

  return `
    <div class="settlement-comparison-result">
      <h3>💰 Settlement Comparison Analysis</h3>
      
      <div class="comparison-content">
        <div class="comparison-chart">
          <div class="chart-bar insurer" style="height: ${insurerHeight}px;">
            <div>Insurer<br/>$${insurerOffer.toLocaleString()}</div>
          </div>
          <div class="chart-bar contractor" style="height: ${contractorHeight}px;">
            <div>Contractor<br/>$${contractorEstimate.toLocaleString()}</div>
          </div>
          ${romEstimate ? `
          <div class="chart-bar rom" style="height: ${romHeight}px;">
            <div>ROM<br/>$${romEstimate.toLocaleString()}</div>
          </div>
          ` : ''}
        </div>
        
        <div class="comparison-stats">
          <div class="stat-item">
            <h4>📊 Percentage Differences</h4>
            <ul>
              <li><strong>vs Contractor:</strong> ${contractorDifference.toFixed(1)}% below</li>
              ${romEstimate ? `<li><strong>vs ROM:</strong> ${romDifference.toFixed(1)}% below</li>` : ''}
            </ul>
          </div>
          
          <div class="stat-item">
            <h4>💡 Recommendation</h4>
            <p class="recommendation">${recommendation}</p>
          </div>
        </div>
        
        <div class="ai-analysis-section">
          <h4>🤖 Professional Analysis</h4>
          <div class="ai-analysis">${aiAnalysis}</div>
        </div>
        
        <div class="comparison-actions">
          <button class="download-btn" onclick="downloadComparison()">Download Analysis</button>
          <button class="download-btn" onclick="generateDemandLetter()">Generate Demand Letter</button>
          <button class="download-btn" onclick="saveToDocuments()">Save to Documents</button>
        </div>
      </div>
    </div>
  `;
}

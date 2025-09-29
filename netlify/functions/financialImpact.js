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
const FinancialImpactSchema = z.object({
  claimValue: z.number().positive(),
  professionalFee: z.number().min(0).max(50), // 0-50% fee
  outOfPocket: z.number().min(0)
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

    console.log(`Processing financial impact calculation for user: ${user.email}`);

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

    const { claimValue, professionalFee, outOfPocket } = requestData;

    // Validate input
    const validationResult = FinancialImpactSchema.safeParse({ 
      claimValue, 
      professionalFee, 
      outOfPocket 
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
          message: "Free users get 2 financial calculations per month. Upgrade for unlimited access."
        }) 
      };
    }

    console.log(`Calculating financial impact: Claim $${claimValue}, Fee ${professionalFee}%, Out-of-pocket $${outOfPocket}`);

    // Calculate financial scenarios
    const professionalFeeAmount = (claimValue * professionalFee) / 100;
    const projectedPayoutWithProfessional = claimValue - professionalFeeAmount - outOfPocket;
    const projectedPayoutWithoutProfessional = claimValue * 0.6 - outOfPocket; // Assume 40% reduction without professional help
    const netBenefit = projectedPayoutWithProfessional - projectedPayoutWithoutProfessional;

    // Generate AI analysis and recommendation
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a financial advisor specializing in insurance claims and professional services. Your role is to analyze the financial impact of hiring professional help for insurance claims.

CRITICAL REQUIREMENTS:
- Analyze the financial benefits of professional assistance
- Compare scenarios with and without professional help
- Provide specific dollar amounts and percentages
- Explain the value proposition of professional services
- Include risk analysis and potential outcomes
- Provide clear, actionable recommendations
- Use professional financial terminology
- Include specific calculations and projections

ANALYSIS STRUCTURE:
1. Financial Summary
2. Scenario Comparison
3. Value Analysis
4. Risk Assessment
5. Recommendation
6. Next Steps

QUALITY STANDARDS:
- Every analysis must be specific and data-driven
- Include exact dollar amounts and percentages
- Provide clear recommendations
- Explain financial implications
- Maintain professional, objective tone` 
          },
          { 
            role: "user", 
            content: `Analyze the financial impact of hiring professional help for an insurance claim:
            
            - Claim Value: $${claimValue.toLocaleString()}
            - Professional Fee: ${professionalFee}% ($${professionalFeeAmount.toLocaleString()})
            - Out-of-Pocket Expenses: $${outOfPocket.toLocaleString()}
            
            Projected Payout with Professional Help: $${projectedPayoutWithProfessional.toLocaleString()}
            Projected Payout without Professional Help: $${projectedPayoutWithoutProfessional.toLocaleString()}
            Net Benefit: $${netBenefit.toLocaleString()}
            
            Provide a comprehensive financial analysis and recommendation.` 
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

    console.log(`Financial impact analysis generated successfully. Tokens used: ${tokensUsed}`);

    // Generate recommendation
    let recommendation = "Consider professional help";
    if (netBenefit > 10000) {
      recommendation = "Strongly recommend professional help - significant financial benefit";
    } else if (netBenefit > 5000) {
      recommendation = "Recommend professional help - good financial benefit";
    } else if (netBenefit > 0) {
      recommendation = "Consider professional help - modest financial benefit";
    } else {
      recommendation = "Professional help may not be cost-effective";
    }

    // Save calculation to database
    const { error: insertError } = await supabase
      .from("financial_calcs")
      .insert({
        user_email: user.email,
        claim_value: claimValue,
        professional_fee_percent: professionalFee,
        out_of_pocket_expenses: outOfPocket,
        projected_payout_with_professional: projectedPayoutWithProfessional,
        projected_payout_without_professional: projectedPayoutWithoutProfessional,
        net_benefit: netBenefit,
        ai_recommendation: aiAnalysis
      });

    if (insertError) {
      console.error("Error saving financial calculation:", insertError.message);
      // Don't fail the request, but log the error
    }

    // Deduct credit only after successful calculation
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
      mode: "financial-calculator",
      tokens_used: tokensUsed,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error("Error logging credit usage:", logError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Financial impact calculation completed in ${processingTime}ms`);

    // Generate HTML response
    const html = generateFinancialHTML(claimValue, professionalFee, outOfPocket, professionalFeeAmount, projectedPayoutWithProfessional, projectedPayoutWithoutProfessional, netBenefit, aiAnalysis, recommendation);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        html: html,
        analysis: aiAnalysis,
        recommendation: recommendation,
        net_benefit: netBenefit,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime
      }) 
    };

  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error("Financial Impact Error:", {
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

function generateFinancialHTML(claimValue, professionalFee, outOfPocket, professionalFeeAmount, projectedPayoutWithProfessional, projectedPayoutWithoutProfessional, netBenefit, aiAnalysis, recommendation) {
  const maxValue = Math.max(projectedPayoutWithProfessional, projectedPayoutWithoutProfessional);
  const withProfessionalHeight = (projectedPayoutWithProfessional / maxValue) * 200;
  const withoutProfessionalHeight = (projectedPayoutWithoutProfessional / maxValue) * 200;

  return `
    <div class="financial-impact-result">
      <h3>🧮 Financial Impact Analysis</h3>
      
      <div class="financial-content">
        <div class="financial-summary">
          <h4>💰 Financial Summary</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <label>Claim Value:</label>
              <span>$${claimValue.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <label>Professional Fee (${professionalFee}%):</label>
              <span>$${professionalFeeAmount.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <label>Out-of-Pocket:</label>
              <span>$${outOfPocket.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="scenario-comparison">
          <h4>📊 Scenario Comparison</h4>
          <div class="comparison-chart">
            <div class="chart-bar with-professional" style="height: ${withProfessionalHeight}px;">
              <div>With Professional<br/>$${projectedPayoutWithProfessional.toLocaleString()}</div>
            </div>
            <div class="chart-bar without-professional" style="height: ${withoutProfessionalHeight}px;">
              <div>Without Professional<br/>$${projectedPayoutWithoutProfessional.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div class="benefit-analysis">
          <h4>📈 Net Benefit Analysis</h4>
          <div class="benefit-item">
            <label>Net Benefit:</label>
            <span class="benefit-amount ${netBenefit > 0 ? 'positive' : 'negative'}">$${netBenefit.toLocaleString()}</span>
          </div>
          <div class="benefit-item">
            <label>ROI:</label>
            <span>${((netBenefit / professionalFeeAmount) * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <div class="recommendation-section">
          <h4>💡 Recommendation</h4>
          <p class="recommendation">${recommendation}</p>
        </div>
        
        <div class="ai-analysis-section">
          <h4>🤖 Professional Analysis</h4>
          <div class="ai-analysis">${aiAnalysis}</div>
        </div>
        
        <div class="financial-actions">
          <button class="download-btn" onclick="downloadAnalysis()">Download Analysis</button>
          <button class="download-btn" onclick="saveToDocuments()">Save to Documents</button>
        </div>
      </div>
    </div>
  `;
}

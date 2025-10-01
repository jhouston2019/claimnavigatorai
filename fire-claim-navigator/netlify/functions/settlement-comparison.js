exports.handler = async (event) => {
  try {
    // Parse request body
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Invalid JSON in request body" 
        })
      };
    }

    const { 
      insurerOffer, 
      claimantEstimate, 
      contractorEstimates = [], 
      expertEstimates = [],
      policyLimits,
      deductible,
      additionalExpenses = 0
    } = requestData;

    if (!insurerOffer || !claimantEstimate) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Insurer offer and claimant estimate are required" 
        })
      };
    }

    console.log("Calculating settlement comparison");

    // Calculate averages
    const contractorAverage = contractorEstimates.length > 0 
      ? contractorEstimates.reduce((sum, est) => sum + est.amount, 0) / contractorEstimates.length 
      : 0;
    
    const expertAverage = expertEstimates.length > 0 
      ? expertEstimates.reduce((sum, est) => sum + est.amount, 0) / expertEstimates.length 
      : 0;

    // Calculate fair settlement range
    const estimates = [claimantEstimate, ...contractorEstimates.map(e => e.amount), ...expertEstimates.map(e => e.amount)].filter(e => e > 0);
    const minEstimate = Math.min(...estimates);
    const maxEstimate = Math.max(...estimates);
    const averageEstimate = estimates.reduce((sum, est) => sum + est, 0) / estimates.length;

    // Calculate differences
    const difference = insurerOffer - claimantEstimate;
    const percentageDifference = ((insurerOffer - claimantEstimate) / claimantEstimate) * 100;
    const shortfall = claimantEstimate - insurerOffer;

    // Calculate potential additional amounts
    const potentialAdditional = Math.max(0, averageEstimate - insurerOffer);
    const potentialPercentage = ((averageEstimate - insurerOffer) / insurerOffer) * 100;

    // Generate recommendations
    const recommendations = generateRecommendations({
      difference,
      percentageDifference,
      shortfall,
      contractorAverage,
      expertAverage,
      averageEstimate,
      policyLimits,
      deductible
    });

    const comparison = {
      insurerOffer,
      claimantEstimate,
      contractorAverage,
      expertAverage,
      averageEstimate,
      minEstimate,
      maxEstimate,
      difference,
      percentageDifference,
      shortfall,
      potentialAdditional,
      potentialPercentage,
      recommendations,
      calculations: {
        netAfterDeductible: insurerOffer - (deductible || 0),
        totalClaimValue: averageEstimate + additionalExpenses,
        coverageAdequacy: policyLimits ? (averageEstimate <= policyLimits) : null
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        comparison,
        generatedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Error in settlement-comparison:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      })
    };
  }
};

function generateRecommendations(data) {
  const recommendations = [];

  if (data.percentageDifference < -20) {
    recommendations.push({
      priority: "HIGH",
      category: "Negotiation",
      title: "Significant Underpayment",
      description: `The insurer's offer is ${Math.abs(data.percentageDifference).toFixed(1)}% below your estimate. This represents a significant underpayment.`,
      actions: [
        "Request detailed explanation of the insurer's valuation",
        "Provide additional supporting documentation",
        "Consider hiring a public adjuster",
        "Demand appraisal if policy allows"
      ]
    });
  }

  if (data.contractorAverage > data.insurerOffer) {
    recommendations.push({
      priority: "HIGH",
      category: "Evidence",
      title: "Contractor Estimates Support Higher Value",
      description: `Professional contractor estimates average $${data.contractorAverage.toLocaleString()}, supporting a higher claim value.`,
      actions: [
        "Submit all contractor estimates to insurer",
        "Request insurer's contractor to provide detailed breakdown",
        "Consider independent appraisal"
      ]
    });
  }

  if (data.expertAverage > data.insurerOffer) {
    recommendations.push({
      priority: "MEDIUM",
      category: "Expert Opinion",
      title: "Expert Opinions Support Higher Value",
      description: `Expert estimates average $${data.expertAverage.toLocaleString()}, providing professional support for higher valuation.`,
      actions: [
        "Submit expert reports to insurer",
        "Request detailed explanation of any disagreements",
        "Consider mediation or appraisal"
      ]
    });
  }

  if (data.potentialAdditional > 0) {
    recommendations.push({
      priority: "MEDIUM",
      category: "Negotiation",
      title: "Potential Additional Recovery",
      description: `Based on average estimates, you may be entitled to an additional $${data.potentialAdditional.toLocaleString()}.`,
      actions: [
        "Document all supporting evidence",
        "Prepare detailed counter-offer",
        "Consider professional representation"
      ]
    });
  }

  if (data.calculations.coverageAdequacy === false) {
    recommendations.push({
      priority: "HIGH",
      category: "Coverage",
      title: "Policy Limits May Be Insufficient",
      description: "Your claim may exceed policy limits. Consider additional coverage options.",
      actions: [
        "Review policy limits carefully",
        "Consider umbrella coverage for future",
        "Document all losses thoroughly"
      ]
    });
  }

  // Add general recommendations
  recommendations.push({
    priority: "LOW",
    category: "General",
    title: "General Recommendations",
    description: "Best practices for settlement negotiation.",
    actions: [
      "Keep detailed records of all communications",
      "Document all expenses and losses",
      "Consider professional representation for complex claims",
      "Understand your rights under state law"
    ]
  });

  return recommendations;
}

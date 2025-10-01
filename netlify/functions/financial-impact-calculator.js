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
      claimAmount,
      currentOffer,
      professionalFees = {},
      timeInvestment = {},
      potentialOutcomes = {},
      claimType = 'property'
    } = requestData;

    if (!claimAmount || !currentOffer) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Claim amount and current offer are required" 
        })
      };
    }

    console.log("Calculating financial impact for claim type:", claimType);

    // Calculate potential additional recovery
    const potentialAdditional = claimAmount - currentOffer;
    const percentageIncrease = ((claimAmount - currentOffer) / currentOffer) * 100);

    // Calculate professional fees
    const publicAdjusterFee = professionalFees.publicAdjusterRate || 0.10; // 10% default
    const attorneyFee = professionalFees.attorneyRate || 0.33; // 33% default
    const expertFee = professionalFees.expertFee || 0;

    // Calculate time investment
    const hoursPerWeek = timeInvestment.hoursPerWeek || 5;
    const weeksToResolution = timeInvestment.weeksToResolution || 12;
    const hourlyRate = timeInvestment.hourlyRate || 25; // $25/hour default
    const totalTimeHours = hoursPerWeek * weeksToResolution;
    const timeValue = totalTimeHours * hourlyRate;

    // Calculate scenarios
    const scenarios = calculateScenarios({
      claimAmount,
      currentOffer,
      potentialAdditional,
      publicAdjusterFee,
      attorneyFee,
      expertFee,
      timeValue,
      claimType
    });

    // Calculate ROI
    const roi = calculateROI(scenarios, timeValue);

    // Generate recommendations
    const recommendations = generateFinancialRecommendations({
      scenarios,
      roi,
      claimAmount,
      currentOffer,
      potentialAdditional,
      claimType
    });

    const analysis = {
      claimAmount,
      currentOffer,
      potentialAdditional,
      percentageIncrease,
      scenarios,
      roi,
      recommendations,
      calculations: {
        timeInvestment: {
          hoursPerWeek,
          weeksToResolution,
          totalHours: totalTimeHours,
          hourlyRate,
          totalTimeValue: timeValue
        },
        professionalFees: {
          publicAdjusterFee,
          attorneyFee,
          expertFee
        }
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
        analysis,
        generatedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Error in financial-impact-calculator:", error);
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

function calculateScenarios(data) {
  const scenarios = [];

  // Scenario 1: DIY (No Professional Help)
  const diyRecovery = data.currentOffer + (data.potentialAdditional * 0.3); // Assume 30% success rate
  const diyNet = diyRecovery - data.timeValue;
  scenarios.push({
    name: "DIY Approach",
    description: "Handle claim yourself with tools and guidance",
    grossRecovery: diyRecovery,
    fees: data.timeValue,
    netRecovery: diyNet,
    successRate: 0.3,
    timeToResolution: "3-6 months",
    pros: ["No professional fees", "Full control", "Learning experience"],
    cons: ["Lower success rate", "Time intensive", "Complex negotiations"]
  });

  // Scenario 2: Public Adjuster
  const paRecovery = data.currentOffer + (data.potentialAdditional * 0.7); // 70% success rate
  const paFees = paRecovery * data.publicAdjusterFee;
  const paNet = paRecovery - paFees;
  scenarios.push({
    name: "Public Adjuster",
    description: "Hire a public adjuster to handle your claim",
    grossRecovery: paRecovery,
    fees: paFees,
    netRecovery: paNet,
    successRate: 0.7,
    timeToResolution: "2-4 months",
    pros: ["Higher success rate", "Professional expertise", "Less time investment"],
    cons: ["10% fee", "Less control", "May not be available in all states"]
  });

  // Scenario 3: Attorney
  const attorneyRecovery = data.currentOffer + (data.potentialAdditional * 0.8); // 80% success rate
  const attorneyFees = attorneyRecovery * data.attorneyFee;
  const attorneyNet = attorneyRecovery - attorneyFees;
  scenarios.push({
    name: "Attorney",
    description: "Hire an attorney for complex or disputed claims",
    grossRecovery: attorneyRecovery,
    fees: attorneyFees,
    netRecovery: attorneyNet,
    successRate: 0.8,
    timeToResolution: "6-12 months",
    pros: ["Highest success rate", "Legal expertise", "Litigation option"],
    cons: ["33% fee", "Longer timeline", "Expensive for small claims"]
  });

  // Scenario 4: Hybrid Approach
  const hybridRecovery = data.currentOffer + (data.potentialAdditional * 0.6); // 60% success rate
  const hybridFees = (hybridRecovery * 0.05) + data.expertFee; // 5% + expert fees
  const hybridNet = hybridRecovery - hybridFees;
  scenarios.push({
    name: "Hybrid Approach",
    description: "Use tools + limited professional help",
    grossRecovery: hybridRecovery,
    fees: hybridFees,
    netRecovery: hybridNet,
    successRate: 0.6,
    timeToResolution: "4-8 months",
    pros: ["Balanced approach", "Lower fees", "Professional guidance"],
    cons: ["Moderate success rate", "Still time intensive"]
  });

  return scenarios;
}

function calculateROI(scenarios, timeValue) {
  const currentOffer = scenarios[0].grossRecovery - scenarios[0].fees; // Use DIY as baseline
  
  return scenarios.map(scenario => {
    const additionalRecovery = scenario.netRecovery - currentOffer;
    const roi = (additionalRecovery / Math.max(scenario.fees, 1)) * 100;
    
    return {
      scenario: scenario.name,
      additionalRecovery,
      roi,
      breakEvenPoint: scenario.fees,
      netBenefit: additionalRecovery
    };
  });
}

function generateFinancialRecommendations(data) {
  const recommendations = [];

  // Find best scenario
  const bestScenario = data.scenarios.reduce((best, current) => 
    current.netRecovery > best.netRecovery ? current : best
  );

  recommendations.push({
    priority: "HIGH",
    category: "Strategy",
    title: "Recommended Approach",
    description: `Based on financial analysis, the ${bestScenario.name} offers the highest net recovery of $${bestScenario.netRecovery.toLocaleString()}.`,
    actions: [
      `Consider ${bestScenario.name} for maximum recovery`,
      "Review the pros and cons of each approach",
      "Factor in your time availability and expertise"
    ]
  });

  // ROI Analysis
  const positiveROI = data.roi.filter(r => r.roi > 0);
  if (positiveROI.length > 0) {
    recommendations.push({
      priority: "MEDIUM",
      category: "ROI",
      title: "Positive ROI Scenarios",
      description: `${positiveROI.length} scenarios show positive return on investment.`,
      actions: [
        "Focus on scenarios with positive ROI",
        "Consider the break-even point for each approach",
        "Factor in your risk tolerance"
      ]
    });
  }

  // Break-even analysis
  const breakEvenScenarios = data.scenarios.filter(s => s.netRecovery > 0);
  if (breakEvenScenarios.length < data.scenarios.length) {
    recommendations.push({
      priority: "MEDIUM",
      category: "Risk",
      title: "Break-Even Analysis",
      description: "Some scenarios may not provide sufficient additional recovery to justify the investment.",
      actions: [
        "Carefully evaluate scenarios that barely break even",
        "Consider the risk of not recovering additional amounts",
        "Factor in non-financial benefits (peace of mind, learning)"
      ]
    });
  }

  // Claim-specific recommendations
  if (data.claimType === 'property' && data.potentialAdditional > 50000) {
    recommendations.push({
      priority: "HIGH",
      category: "Property Claims",
      title: "High-Value Property Claim",
      description: "For high-value claims, professional representation often pays for itself.",
      actions: [
        "Strongly consider professional representation",
        "Document everything thoroughly",
        "Consider multiple professional opinions"
      ]
    });
  }

  if (data.claimType === 'health' && data.potentialAdditional > 10000) {
    recommendations.push({
      priority: "HIGH",
      category: "Health Claims",
      title: "Health Insurance Appeal",
      description: "Health insurance appeals have specific procedures and deadlines.",
      actions: [
        "Understand your appeal rights",
        "Meet all deadlines",
        "Consider professional help for complex cases"
      ]
    });
  }

  return recommendations;
}

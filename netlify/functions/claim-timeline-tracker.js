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
      action,
      claimData = {},
      timelineData = {},
      state = 'CA',
      claimType = 'property'
    } = requestData;

    console.log("Claim Timeline Tracker - Action:", action);

    if (action === 'get-timeline') {
      return getClaimTimeline(claimType, state, claimData);
    } else if (action === 'update-phase') {
      return updateTimelinePhase(timelineData);
    } else if (action === 'get-deadlines') {
      return getStateDeadlines(state, claimType);
    } else if (action === 'get-next-steps') {
      return getNextSteps(timelineData, claimType);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Invalid action specified" 
        })
      };
    }

  } catch (error) {
    console.error("Error in claim-timeline-tracker:", error);
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

function getClaimTimeline(claimType, state, claimData) {
  const timelines = {
    property: {
      phases: [
        {
          id: 'initial-report',
          name: 'Initial Report',
          description: 'Report the loss to your insurance company',
          status: 'pending',
          deadline: null,
          requirements: [
            'Contact insurance company within 24 hours',
            'Provide basic loss information',
            'Obtain claim number',
            'Document initial damage with photos'
          ],
          documents: ['Notice of Claim', 'Initial Damage Photos'],
          estimatedDays: 1
        },
        {
          id: 'claim-setup',
          name: 'Claim Setup',
          description: 'Insurance company assigns adjuster and sets up claim',
          status: 'pending',
          deadline: null,
          requirements: [
            'Receive claim number confirmation',
            'Get adjuster contact information',
            'Schedule initial inspection',
            'Review policy coverage'
          ],
          documents: ['Claim Number Confirmation', 'Adjuster Contact Info'],
          estimatedDays: 3
        },
        {
          id: 'inspection',
          name: 'Property Inspection',
          description: 'Insurance adjuster inspects the damage',
          status: 'pending',
          deadline: null,
          requirements: [
            'Prepare property for inspection',
            'Document all damage areas',
            'Provide access to adjuster',
            'Take detailed photos during inspection'
          ],
          documents: ['Inspection Report', 'Damage Documentation'],
          estimatedDays: 7
        },
        {
          id: 'estimate-review',
          name: 'Estimate Review',
          description: 'Review and negotiate insurance estimate',
          status: 'pending',
          deadline: null,
          requirements: [
            'Review insurance estimate',
            'Obtain independent estimates if needed',
            'Compare estimates',
            'Negotiate if necessary'
          ],
          documents: ['Insurance Estimate', 'Independent Estimates', 'Comparison Analysis'],
          estimatedDays: 14
        },
        {
          id: 'settlement',
          name: 'Settlement',
          description: 'Finalize and receive settlement payment',
          status: 'pending',
          deadline: null,
          requirements: [
            'Review final settlement offer',
            'Sign settlement agreement',
            'Receive payment',
            'Complete any required releases'
          ],
          documents: ['Settlement Agreement', 'Payment Confirmation'],
          estimatedDays: 21
        }
      ]
    },
    auto: {
      phases: [
        {
          id: 'accident-report',
          name: 'Accident Report',
          description: 'Report accident to insurance and police',
          status: 'pending',
          deadline: null,
          requirements: [
            'Call police if required by law',
            'Exchange information with other parties',
            'Report to insurance company',
            'Document accident scene'
          ],
          documents: ['Police Report', 'Accident Photos', 'Witness Statements'],
          estimatedDays: 1
        },
        {
          id: 'vehicle-inspection',
          name: 'Vehicle Inspection',
          description: 'Insurance company inspects vehicle damage',
          status: 'pending',
          deadline: null,
          requirements: [
            'Schedule vehicle inspection',
            'Prepare vehicle for inspection',
            'Provide repair estimates if available',
            'Document all damage'
          ],
          documents: ['Inspection Report', 'Repair Estimates'],
          estimatedDays: 5
        },
        {
          id: 'damage-assessment',
          name: 'Damage Assessment',
          description: 'Determine repair costs and vehicle value',
          status: 'pending',
          deadline: null,
          requirements: [
            'Review repair estimates',
            'Determine if vehicle is total loss',
            'Negotiate settlement if needed',
            'Choose repair shop or total loss settlement'
          ],
          documents: ['Repair Estimates', 'Total Loss Evaluation'],
          estimatedDays: 10
        },
        {
          id: 'settlement',
          name: 'Settlement',
          description: 'Finalize settlement and complete repairs',
          status: 'pending',
          deadline: null,
          requirements: [
            'Review final settlement',
            'Complete repairs or total loss process',
            'Receive payment',
            'Update vehicle registration if needed'
          ],
          documents: ['Settlement Agreement', 'Repair Completion'],
          estimatedDays: 21
        }
      ]
    }
  };

  const timeline = timelines[claimType] || timelines.property;
  
  // Add state-specific deadlines
  const stateDeadlines = getStateDeadlines(state, claimType);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      timeline: {
        phases: timeline.phases,
        stateDeadlines,
        currentPhase: determineCurrentPhase(timeline.phases, claimData),
        progress: calculateProgress(timeline.phases, claimData)
      }
    })
  };
}

function getStateDeadlines(state, claimType) {
  const deadlines = {
    CA: {
      property: {
        'Notice of Claim': 'Immediately',
        'Proof of Loss': '60 days from request',
        'Suit Deadline': '1 year from loss',
        'Appraisal Demand': 'Any time after denial'
      },
      auto: {
        'Notice of Claim': 'Immediately',
        'Proof of Loss': '30 days from request',
        'Suit Deadline': '2 years from loss'
      }
    },
    TX: {
      property: {
        'Notice of Claim': 'Immediately',
        'Proof of Loss': '91 days from request',
        'Suit Deadline': '2 years from loss',
        'Appraisal Demand': 'Any time after denial'
      },
      auto: {
        'Notice of Claim': 'Immediately',
        'Proof of Loss': '30 days from request',
        'Suit Deadline': '2 years from loss'
      }
    },
    FL: {
      property: {
        'Notice of Claim': 'Immediately',
        'Proof of Loss': '60 days from request',
        'Suit Deadline': '5 years from loss',
        'Appraisal Demand': 'Any time after denial'
      },
      auto: {
        'Notice of Claim': 'Immediately',
        'Proof of Loss': '30 days from request',
        'Suit Deadline': '4 years from loss'
      }
    }
  };

  return deadlines[state]?.[claimType] || deadlines.CA[claimType] || {};
}

function determineCurrentPhase(phases, claimData) {
  // Logic to determine current phase based on claim data
  if (claimData.claimNumber && !claimData.inspectionDate) {
    return 'claim-setup';
  } else if (claimData.inspectionDate && !claimData.estimateReceived) {
    return 'inspection';
  } else if (claimData.estimateReceived && !claimData.settlementReceived) {
    return 'estimate-review';
  } else if (claimData.settlementReceived) {
    return 'settlement';
  }
  return 'initial-report';
}

function calculateProgress(phases, claimData) {
  const completedPhases = phases.filter(phase => 
    claimData[phase.id + 'Completed'] || 
    (phase.id === 'initial-report' && claimData.claimNumber) ||
    (phase.id === 'claim-setup' && claimData.adjusterAssigned) ||
    (phase.id === 'inspection' && claimData.inspectionDate) ||
    (phase.id === 'estimate-review' && claimData.estimateReceived) ||
    (phase.id === 'settlement' && claimData.settlementReceived)
  ).length;

  return Math.round((completedPhases / phases.length) * 100);
}

function updateTimelinePhase(timelineData) {
  // Update timeline phase logic
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'Timeline phase updated successfully',
      updatedPhase: timelineData.phaseId,
      nextSteps: getNextStepsForPhase(timelineData.phaseId)
    })
  };
}

function getNextSteps(timelineData, claimType) {
  const currentPhase = timelineData.currentPhase || 'initial-report';
  
  const nextSteps = {
    'initial-report': [
      'Contact your insurance company immediately',
      'Document the loss with photos and videos',
      'Secure the property to prevent further damage',
      'Keep all receipts for emergency repairs'
    ],
    'claim-setup': [
      'Confirm your claim number',
      'Get your adjuster\'s contact information',
      'Review your policy coverage',
      'Prepare for the inspection'
    ],
    'inspection': [
      'Prepare the property for inspection',
      'Document all damage areas',
      'Have repair estimates ready',
      'Be present during the inspection'
    ],
    'estimate-review': [
      'Review the insurance estimate carefully',
      'Get independent estimates if needed',
      'Compare all estimates',
      'Negotiate if the estimate seems low'
    ],
    'settlement': [
      'Review the final settlement offer',
      'Understand what you\'re signing',
      'Ensure all damages are covered',
      'Complete any required documentation'
    ]
  };

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      nextSteps: nextSteps[currentPhase] || [],
      currentPhase,
      recommendations: getRecommendationsForPhase(currentPhase, claimType)
    })
  };
}

function getNextStepsForPhase(phaseId) {
  const phaseSteps = {
    'initial-report': ['Document everything', 'Contact insurance', 'Secure property'],
    'claim-setup': ['Get claim number', 'Meet adjuster', 'Review policy'],
    'inspection': ['Prepare property', 'Document damage', 'Get estimates'],
    'estimate-review': ['Review estimate', 'Get independent estimates', 'Negotiate if needed'],
    'settlement': ['Review settlement', 'Sign documents', 'Receive payment']
  };

  return phaseSteps[phaseId] || [];
}

function getRecommendationsForPhase(phase, claimType) {
  const recommendations = {
    'initial-report': [
      'Take photos immediately - damage may change',
      'Don\'t throw anything away until inspected',
      'Keep detailed records of all communications',
      'Consider hiring a public adjuster for complex claims'
    ],
    'claim-setup': [
      'Get everything in writing',
      'Understand your policy limits and deductibles',
      'Ask about additional living expenses coverage',
      'Keep a detailed log of all interactions'
    ],
    'inspection': [
      'Be present during the inspection',
      'Point out all damage areas',
      'Ask questions about the inspection process',
      'Get a copy of the inspection report'
    ],
    'estimate-review': [
      'Don\'t accept the first offer if it seems low',
      'Get multiple independent estimates',
      'Understand the difference between ACV and RCV',
      'Consider hiring a public adjuster for negotiation'
    ],
    'settlement': [
      'Read all documents carefully before signing',
      'Make sure all damages are covered',
      'Don\'t sign releases for uncovered damages',
      'Keep copies of all settlement documents'
    ]
  };

  return recommendations[phase] || [];
}

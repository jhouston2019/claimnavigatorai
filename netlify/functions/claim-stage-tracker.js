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
      claimType = 'property',
      currentStage = 'initial',
      claimData = {},
      userProgress = {}
    } = requestData;

    console.log("Claim Stage Tracker - Action:", action);

    if (action === 'get-stages') {
      return getClaimStages(claimType);
    } else if (action === 'get-current-stage') {
      return getCurrentStage(claimType, claimData, userProgress);
    } else if (action === 'update-stage') {
      return updateClaimStage(claimType, requestData.newStage, userProgress);
    } else if (action === 'get-stage-details') {
      return getStageDetails(claimType, currentStage);
    } else if (action === 'get-next-actions') {
      return getNextActions(claimType, currentStage, userProgress);
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
    console.error("Error in claim-stage-tracker:", error);
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

function getClaimStages(claimType) {
  const stages = {
    property: {
      stages: [
        {
          id: 'initial',
          name: 'Initial Loss',
          description: 'Loss occurs and initial documentation',
          status: 'pending',
          icon: '🚨',
          color: '#dc2626',
          requirements: [
            'Take immediate photos of damage',
            'Contact insurance company',
            'Secure property to prevent further damage',
            'Document emergency repairs'
          ],
          tools: ['Documentation Checklist', 'Evidence Organizer'],
          estimatedDays: 1,
          critical: true
        },
        {
          id: 'claim-setup',
          name: 'Claim Setup',
          description: 'Insurance company processes initial claim',
          status: 'pending',
          icon: '📋',
          color: '#f59e0b',
          requirements: [
            'Receive claim number',
            'Get adjuster contact information',
            'Review policy coverage',
            'Prepare for inspection'
          ],
          tools: ['Policy Analyzer', 'Claim Timeline'],
          estimatedDays: 3,
          critical: true
        },
        {
          id: 'inspection',
          name: 'Property Inspection',
          description: 'Insurance adjuster inspects damage',
          status: 'pending',
          icon: '🔍',
          color: '#3b82f6',
          requirements: [
            'Prepare property for inspection',
            'Document all damage areas',
            'Provide access to adjuster',
            'Take detailed photos during inspection'
          ],
          tools: ['Evidence Organizer', 'Documentation Checklist'],
          estimatedDays: 7,
          critical: true
        },
        {
          id: 'estimate-review',
          name: 'Estimate Review',
          description: 'Review and negotiate insurance estimate',
          status: 'pending',
          icon: '💰',
          color: '#10b981',
          requirements: [
            'Review insurance estimate',
            'Obtain independent estimates',
            'Compare estimates',
            'Negotiate if necessary'
          ],
          tools: ['Settlement Comparison', 'Financial Calculator'],
          estimatedDays: 14,
          critical: true
        },
        {
          id: 'settlement',
          name: 'Settlement',
          description: 'Finalize and receive settlement',
          status: 'pending',
          icon: '✅',
          color: '#059669',
          requirements: [
            'Review final settlement offer',
            'Sign settlement agreement',
            'Receive payment',
            'Complete required releases'
          ],
          tools: ['Document Generator', 'Negotiation Scripts'],
          estimatedDays: 21,
          critical: true
        }
      ]
    },
    auto: {
      stages: [
        {
          id: 'accident',
          name: 'Accident Occurs',
          description: 'Accident happens and initial response',
          status: 'pending',
          icon: '🚗',
          color: '#dc2626',
          requirements: [
            'Take photos of accident scene',
            'Exchange information with other parties',
            'Contact police if required',
            'Contact insurance company'
          ],
          tools: ['Documentation Checklist', 'Evidence Organizer'],
          estimatedDays: 1,
          critical: true
        },
        {
          id: 'claim-setup',
          name: 'Claim Setup',
          description: 'Insurance company processes claim',
          status: 'pending',
          icon: '📋',
          color: '#f59e0b',
          requirements: [
            'Receive claim number',
            'Get adjuster contact information',
            'Review policy coverage',
            'Schedule vehicle inspection'
          ],
          tools: ['Policy Analyzer', 'Claim Timeline'],
          estimatedDays: 3,
          critical: true
        },
        {
          id: 'inspection',
          name: 'Vehicle Inspection',
          description: 'Insurance company inspects vehicle',
          status: 'pending',
          icon: '🔧',
          color: '#3b82f6',
          requirements: [
            'Prepare vehicle for inspection',
            'Document all damage',
            'Provide repair estimates if available',
            'Meet with adjuster'
          ],
          tools: ['Evidence Organizer', 'Documentation Checklist'],
          estimatedDays: 7,
          critical: true
        },
        {
          id: 'damage-assessment',
          name: 'Damage Assessment',
          description: 'Determine repair costs and settlement',
          status: 'pending',
          icon: '💰',
          color: '#10b981',
          requirements: [
            'Review repair estimates',
            'Determine if vehicle is total loss',
            'Negotiate settlement if needed',
            'Choose repair shop or total loss'
          ],
          tools: ['Settlement Comparison', 'Financial Calculator'],
          estimatedDays: 14,
          critical: true
        },
        {
          id: 'settlement',
          name: 'Settlement',
          description: 'Complete repairs or total loss process',
          status: 'pending',
          icon: '✅',
          color: '#059669',
          requirements: [
            'Review final settlement',
            'Complete repairs or total loss',
            'Receive payment',
            'Update vehicle registration'
          ],
          tools: ['Document Generator', 'Negotiation Scripts'],
          estimatedDays: 21,
          critical: true
        }
      ]
    },
    health: {
      stages: [
        {
          id: 'medical-event',
          name: 'Medical Event',
          description: 'Medical event occurs and treatment begins',
          status: 'pending',
          icon: '🏥',
          color: '#dc2626',
          requirements: [
            'Seek medical treatment',
            'Obtain medical records',
            'Contact health insurance',
            'Document all medical expenses'
          ],
          tools: ['Documentation Checklist', 'Evidence Organizer'],
          estimatedDays: 1,
          critical: true
        },
        {
          id: 'claim-submission',
          name: 'Claim Submission',
          description: 'Submit claim to health insurance',
          status: 'pending',
          icon: '📋',
          color: '#f59e0b',
          requirements: [
            'Submit claim forms',
            'Provide medical records',
            'Submit itemized bills',
            'Track claim status'
          ],
          tools: ['Document Generator', 'Claim Timeline'],
          estimatedDays: 7,
          critical: true
        },
        {
          id: 'review',
          name: 'Insurance Review',
          description: 'Insurance company reviews claim',
          status: 'pending',
          icon: '🔍',
          color: '#3b82f6',
          requirements: [
            'Respond to information requests',
            'Provide additional documentation',
            'Track review progress',
            'Prepare for potential denial'
          ],
          tools: ['Evidence Organizer', 'Documentation Checklist'],
          estimatedDays: 14,
          critical: true
        },
        {
          id: 'determination',
          name: 'Coverage Determination',
          description: 'Insurance company determines coverage',
          status: 'pending',
          icon: '💰',
          color: '#10b981',
          requirements: [
            'Review coverage determination',
            'Understand covered vs. non-covered',
            'Appeal if necessary',
            'Negotiate if needed'
          ],
          tools: ['Settlement Comparison', 'Appeal Builder'],
          estimatedDays: 21,
          critical: true
        },
        {
          id: 'payment',
          name: 'Payment Processing',
          description: 'Receive payment for covered services',
          status: 'pending',
          icon: '✅',
          color: '#059669',
          requirements: [
            'Review payment details',
            'Verify payment amounts',
            'Address any discrepancies',
            'Complete claim process'
          ],
          tools: ['Document Generator', 'Financial Calculator'],
          estimatedDays: 28,
          critical: true
        }
      ]
    }
  };

  const claimStages = stages[claimType] || stages.property;
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      stages: claimStages.stages,
      claimType,
      totalStages: claimStages.stages.length,
      progress: calculateOverallProgress(claimStages.stages, userProgress)
    })
  };
}

function getCurrentStage(claimType, claimData, userProgress) {
  const stages = getClaimStages(claimType);
  const currentStage = determineCurrentStage(claimType, claimData, userProgress);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      currentStage,
      stageDetails: getStageDetails(claimType, currentStage),
      nextActions: getNextActions(claimType, currentStage, userProgress),
      progress: calculateStageProgress(currentStage, userProgress)
    })
  };
}

function determineCurrentStage(claimType, claimData, userProgress) {
  // Logic to determine current stage based on claim data and progress
  if (claimData.claimNumber && !claimData.inspectionDate) {
    return 'claim-setup';
  } else if (claimData.inspectionDate && !claimData.estimateReceived) {
    return 'inspection';
  } else if (claimData.estimateReceived && !claimData.settlementReceived) {
    return 'estimate-review';
  } else if (claimData.settlementReceived) {
    return 'settlement';
  }
  return 'initial';
}

function getStageDetails(claimType, stageId) {
  const stages = getClaimStages(claimType);
  const stage = stages.stages.find(s => s.id === stageId);
  
  if (!stage) {
    return null;
  }

  return {
    ...stage,
    nextStage: getNextStage(stages.stages, stageId),
    previousStage: getPreviousStage(stages.stages, stageId),
    tools: getStageTools(stageId),
    deadlines: getStageDeadlines(stageId),
    tips: getStageTips(stageId)
  };
}

function getNextStage(stages, currentStageId) {
  const currentIndex = stages.findIndex(s => s.id === currentStageId);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
}

function getPreviousStage(stages, currentStageId) {
  const currentIndex = stages.findIndex(s => s.id === currentStageId);
  return currentIndex > 0 ? stages[currentIndex - 1] : null;
}

function getStageTools(stageId) {
  const stageTools = {
    'initial': ['Documentation Checklist', 'Evidence Organizer', 'Claim Timeline'],
    'claim-setup': ['Policy Analyzer', 'Claim Timeline', 'Documentation Checklist'],
    'inspection': ['Evidence Organizer', 'Documentation Checklist', 'Claim Timeline'],
    'estimate-review': ['Settlement Comparison', 'Financial Calculator', 'Negotiation Scripts'],
    'settlement': ['Document Generator', 'Negotiation Scripts', 'Financial Calculator']
  };

  return stageTools[stageId] || [];
}

function getStageDeadlines(stageId) {
  const stageDeadlines = {
    'initial': ['Report loss immediately', 'Take photos within 24 hours'],
    'claim-setup': ['Get claim number within 3 days', 'Schedule inspection within 7 days'],
    'inspection': ['Complete inspection within 14 days', 'Submit documentation within 30 days'],
    'estimate-review': ['Review estimate within 7 days', 'Submit counter-offer within 14 days'],
    'settlement': ['Review settlement within 7 days', 'Sign documents within 14 days']
  };

  return stageDeadlines[stageId] || [];
}

function getStageTips(stageId) {
  const stageTips = {
    'initial': [
      'Take photos immediately - evidence may change',
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

  return stageTips[stageId] || [];
}

function getNextActions(claimType, currentStage, userProgress) {
  const nextActions = {
    'initial': [
      'Take immediate photos of all damage',
      'Contact your insurance company',
      'Secure property to prevent further damage',
      'Start documenting everything'
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

  return nextActions[currentStage] || [];
}

function calculateStageProgress(currentStage, userProgress) {
  const stageRequirements = getStageRequirements(currentStage);
  const completedRequirements = stageRequirements.filter(req => 
    userProgress[req.id] === true
  ).length;
  
  return {
    currentStage,
    totalRequirements: stageRequirements.length,
    completedRequirements,
    percentage: stageRequirements.length > 0 ? 
      Math.round((completedRequirements / stageRequirements.length) * 100) : 0,
    nextRequirement: getNextRequirement(stageRequirements, userProgress)
  };
}

function getStageRequirements(stageId) {
  const stageRequirements = {
    'initial': [
      { id: 'photos-taken', name: 'Photos of damage taken', critical: true },
      { id: 'insurance-contacted', name: 'Insurance company contacted', critical: true },
      { id: 'property-secured', name: 'Property secured', critical: true },
      { id: 'emergency-repairs', name: 'Emergency repairs documented', critical: false }
    ],
    'claim-setup': [
      { id: 'claim-number', name: 'Claim number received', critical: true },
      { id: 'adjuster-contact', name: 'Adjuster contact information', critical: true },
      { id: 'policy-reviewed', name: 'Policy coverage reviewed', critical: true },
      { id: 'inspection-scheduled', name: 'Inspection scheduled', critical: true }
    ],
    'inspection': [
      { id: 'property-prepared', name: 'Property prepared for inspection', critical: true },
      { id: 'damage-documented', name: 'All damage documented', critical: true },
      { id: 'estimates-ready', name: 'Repair estimates ready', critical: true },
      { id: 'inspection-completed', name: 'Inspection completed', critical: true }
    ],
    'estimate-review': [
      { id: 'estimate-reviewed', name: 'Insurance estimate reviewed', critical: true },
      { id: 'independent-estimates', name: 'Independent estimates obtained', critical: true },
      { id: 'estimates-compared', name: 'Estimates compared', critical: true },
      { id: 'negotiation-started', name: 'Negotiation started if needed', critical: false }
    ],
    'settlement': [
      { id: 'settlement-reviewed', name: 'Final settlement reviewed', critical: true },
      { id: 'documents-understood', name: 'All documents understood', critical: true },
      { id: 'coverage-verified', name: 'All damages covered', critical: true },
      { id: 'documentation-complete', name: 'Required documentation complete', critical: true }
    ]
  };

  return stageRequirements[stageId] || [];
}

function getNextRequirement(requirements, userProgress) {
  return requirements.find(req => !userProgress[req.id]) || null;
}

function calculateOverallProgress(stages, userProgress) {
  const totalStages = stages.length;
  const completedStages = stages.filter(stage => 
    userProgress[stage.id + '_completed'] === true
  ).length;
  
  return {
    totalStages,
    completedStages,
    percentage: Math.round((completedStages / totalStages) * 100),
    currentStage: stages.find(stage => 
      userProgress[stage.id + '_in_progress'] === true
    )?.id || 'initial'
  };
}

function updateClaimStage(claimType, newStage, userProgress) {
  const updatedProgress = {
    ...userProgress,
    [newStage + '_in_progress']: true,
    [newStage + '_started']: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: `Claim stage updated to ${newStage}`,
      currentStage: newStage,
      stageDetails: getStageDetails(claimType, newStage),
      nextActions: getNextActions(claimType, newStage, updatedProgress),
      progress: calculateStageProgress(newStage, updatedProgress)
    })
  };
}

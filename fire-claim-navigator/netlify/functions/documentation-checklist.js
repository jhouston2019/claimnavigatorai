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
      checklistData = {},
      userProgress = {}
    } = requestData;

    console.log("Documentation Checklist - Action:", action);

    if (action === 'get-checklist') {
      return getDocumentationChecklist(claimType);
    } else if (action === 'update-progress') {
      return updateChecklistProgress(checklistData, userProgress);
    } else if (action === 'get-priority-items') {
      return getPriorityItems(claimType, userProgress);
    } else if (action === 'generate-reminders') {
      return generateReminders(claimType, userProgress);
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
    console.error("Error in documentation-checklist:", error);
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

function getDocumentationChecklist(claimType) {
  const checklists = {
    property: {
      title: "Property Claim Documentation Checklist",
      categories: [
        {
          id: 'immediate',
          name: 'Immediate Documentation (First 24 Hours)',
          priority: 'critical',
          items: [
            {
              id: 'photos-immediate',
              description: 'Take photos of all damage areas immediately',
              importance: 'critical',
              tips: 'Take wide shots and close-ups. Include timestamps.',
              completed: false
            },
            {
              id: 'secure-property',
              description: 'Secure property to prevent further damage',
              importance: 'critical',
              tips: 'Board up windows, cover roof damage, turn off utilities if needed.',
              completed: false
            },
            {
              id: 'emergency-repairs',
              description: 'Document any emergency repairs made',
              importance: 'high',
              tips: 'Keep all receipts and take before/after photos.',
              completed: false
            },
            {
              id: 'contact-insurance',
              description: 'Contact insurance company to report claim',
              importance: 'critical',
              tips: 'Get claim number and adjuster contact information.',
              completed: false
            }
          ]
        },
        {
          id: 'damage-documentation',
          name: 'Damage Documentation',
          priority: 'high',
          items: [
            {
              id: 'room-by-room',
              description: 'Document damage room by room',
              importance: 'high',
              tips: 'Create detailed inventory of damaged items with photos.',
              completed: false
            },
            {
              id: 'structural-damage',
              description: 'Document structural damage',
              importance: 'high',
              tips: 'Include foundation, walls, roof, and structural elements.',
              completed: false
            },
            {
              id: 'personal-property',
              description: 'Inventory damaged personal property',
              importance: 'high',
              tips: 'List items with descriptions, age, and estimated value.',
              completed: false
            },
            {
              id: 'exterior-damage',
              description: 'Document exterior damage',
              importance: 'medium',
              tips: 'Include landscaping, fences, sheds, and other structures.',
              completed: false
            }
          ]
        },
        {
          id: 'financial-records',
          name: 'Financial Documentation',
          priority: 'high',
          items: [
            {
              id: 'receipts',
              description: 'Gather receipts for damaged items',
              importance: 'high',
              tips: 'Include purchase receipts, warranties, and appraisals.',
              completed: false
            },
            {
              id: 'repair-estimates',
              description: 'Obtain repair estimates',
              importance: 'high',
              tips: 'Get at least 3 estimates from licensed contractors.',
              completed: false
            },
            {
              id: 'additional-expenses',
              description: 'Document additional living expenses',
              importance: 'medium',
              tips: 'Keep receipts for hotels, meals, and other ALE costs.',
              completed: false
            },
            {
              id: 'lost-income',
              description: 'Document lost income if applicable',
              importance: 'medium',
              tips: 'Include pay stubs and employer verification.',
              completed: false
            }
          ]
        },
        {
          id: 'communication',
          name: 'Communication Records',
          priority: 'high',
          items: [
            {
              id: 'phone-calls',
              description: 'Log all phone calls with insurance company',
              importance: 'high',
              tips: 'Include date, time, person spoken to, and summary.',
              completed: false
            },
            {
              id: 'emails',
              description: 'Save all email correspondence',
              importance: 'high',
              tips: 'Create a dedicated folder for claim emails.',
              completed: false
            },
            {
              id: 'letters',
              description: 'Keep copies of all written correspondence',
              importance: 'medium',
              tips: 'Send important letters via certified mail.',
              completed: false
            },
            {
              id: 'meetings',
              description: 'Document all meetings and inspections',
              importance: 'high',
              tips: 'Take notes and photos during all meetings.',
              completed: false
            }
          ]
        }
      ]
    },
    auto: {
      title: "Auto Claim Documentation Checklist",
      categories: [
        {
          id: 'immediate',
          name: 'Immediate Documentation (First 24 Hours)',
          priority: 'critical',
          items: [
            {
              id: 'accident-photos',
              description: 'Take photos of accident scene and vehicle damage',
              importance: 'critical',
              tips: 'Include damage to all vehicles and accident scene.',
              completed: false
            },
            {
              id: 'police-report',
              description: 'Obtain police report if applicable',
              importance: 'critical',
              tips: 'Get report number and officer information.',
              completed: false
            },
            {
              id: 'witness-info',
              description: 'Collect witness information',
              importance: 'high',
              tips: 'Get names, phone numbers, and statements.',
              completed: false
            },
            {
              id: 'contact-insurance',
              description: 'Contact insurance company',
              importance: 'critical',
              tips: 'Report accident and get claim number.',
              completed: false
            }
          ]
        },
        {
          id: 'vehicle-documentation',
          name: 'Vehicle Documentation',
          priority: 'high',
          items: [
            {
              id: 'damage-assessment',
              description: 'Document all vehicle damage',
              importance: 'high',
              tips: 'Take detailed photos of all damage areas.',
              completed: false
            },
            {
              id: 'repair-estimates',
              description: 'Obtain repair estimates',
              importance: 'high',
              tips: 'Get estimates from multiple shops.',
              completed: false
            },
            {
              id: 'vehicle-history',
              description: 'Gather vehicle maintenance records',
              importance: 'medium',
              tips: 'Include service records and modifications.',
              completed: false
            },
            {
              id: 'rental-vehicle',
              description: 'Document rental vehicle expenses',
              importance: 'medium',
              tips: 'Keep receipts for rental and transportation costs.',
              completed: false
            }
          ]
        }
      ]
    },
    health: {
      title: "Health Insurance Claim Documentation Checklist",
      categories: [
        {
          id: 'immediate',
          name: 'Immediate Documentation',
          priority: 'critical',
          items: [
            {
              id: 'medical-records',
              description: 'Obtain all medical records',
              importance: 'critical',
              tips: 'Request records from all treating providers.',
              completed: false
            },
            {
              id: 'bills',
              description: 'Collect all medical bills',
              importance: 'critical',
              tips: 'Include itemized bills from all providers.',
              completed: false
            },
            {
              id: 'prescriptions',
              description: 'Document prescription medications',
              importance: 'high',
              tips: 'Keep receipts and prescription records.',
              completed: false
            },
            {
              id: 'contact-insurance',
              description: 'Contact health insurance company',
              importance: 'critical',
              tips: 'Report claim and understand coverage.',
              completed: false
            }
          ]
        }
      ]
    }
  };

  const checklist = checklists[claimType] || checklists.property;
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      checklist: {
        ...checklist,
        totalItems: countTotalItems(checklist.categories),
        criticalItems: countCriticalItems(checklist.categories),
        completedItems: 0,
        progressPercentage: 0
      }
    })
  };
}

function countTotalItems(categories) {
  return categories.reduce((total, category) => total + category.items.length, 0);
}

function countCriticalItems(categories) {
  return categories.reduce((total, category) => {
    return total + category.items.filter(item => item.importance === 'critical').length;
  }, 0);
}

function updateChecklistProgress(checklistData, userProgress) {
  const updatedProgress = {
    ...userProgress,
    ...checklistData
  };

  const progressPercentage = calculateProgressPercentage(updatedProgress);
  const criticalItemsCompleted = countCompletedCriticalItems(updatedProgress);
  const nextPriorityItems = getNextPriorityItems(updatedProgress);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      progress: {
        percentage: progressPercentage,
        criticalItemsCompleted,
        nextPriorityItems,
        recommendations: getProgressRecommendations(progressPercentage, criticalItemsCompleted)
      }
    })
  };
}

function calculateProgressPercentage(userProgress) {
  const totalItems = Object.keys(userProgress).length;
  const completedItems = Object.values(userProgress).filter(completed => completed === true).length;
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
}

function countCompletedCriticalItems(userProgress) {
  // This would need to be implemented based on the specific checklist structure
  return Object.values(userProgress).filter(completed => completed === true).length;
}

function getNextPriorityItems(userProgress) {
  const priorityItems = [
    'Take immediate photos of damage',
    'Contact insurance company',
    'Secure property to prevent further damage',
    'Document emergency repairs',
    'Obtain police report (if applicable)'
  ];

  return priorityItems.filter(item => !userProgress[item.toLowerCase().replace(/\s+/g, '-')]);
}

function getProgressRecommendations(percentage, criticalItemsCompleted) {
  const recommendations = [];

  if (percentage < 25) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Focus on immediate documentation - photos and contacting insurance company',
      action: 'Complete critical items first'
    });
  } else if (percentage < 50) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Continue with damage documentation and financial records',
      action: 'Gather repair estimates and receipts'
    });
  } else if (percentage < 75) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Focus on communication records and meeting documentation',
      action: 'Log all interactions with insurance company'
    });
  } else {
    recommendations.push({
      priority: 'LOW',
      message: 'Excellent progress! Complete remaining items and organize documentation',
      action: 'Review and organize all collected documentation'
    });
  }

  if (criticalItemsCompleted < 3) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Complete critical items immediately - these are essential for your claim',
      action: 'Focus on photos, insurance contact, and property security'
    });
  }

  return recommendations;
}

function getPriorityItems(claimType, userProgress) {
  const priorityItems = {
    property: [
      'Take immediate photos of all damage',
      'Contact insurance company within 24 hours',
      'Secure property to prevent further damage',
      'Document emergency repairs with receipts',
      'Obtain repair estimates from contractors'
    ],
    auto: [
      'Take photos of accident scene and vehicle damage',
      'Contact insurance company immediately',
      'Obtain police report if applicable',
      'Collect witness information',
      'Get repair estimates from multiple shops'
    ],
    health: [
      'Obtain all medical records',
      'Collect itemized medical bills',
      'Contact health insurance company',
      'Document prescription medications',
      'Keep receipts for all medical expenses'
    ]
  };

  const items = priorityItems[claimType] || priorityItems.property;
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      priorityItems: items,
      completedItems: items.filter(item => userProgress[item.toLowerCase().replace(/\s+/g, '-')]),
      remainingItems: items.filter(item => !userProgress[item.toLowerCase().replace(/\s+/g, '-')])
    })
  };
}

function generateReminders(claimType, userProgress) {
  const reminders = [];
  const currentTime = new Date();
  
  // Generate reminders based on claim type and progress
  if (claimType === 'property') {
    if (!userProgress['photos-immediate']) {
      reminders.push({
        type: 'urgent',
        message: 'Take photos of damage immediately - evidence may change',
        deadline: 'Within 24 hours',
        action: 'Document all damage areas with photos'
      });
    }
    
    if (!userProgress['contact-insurance']) {
      reminders.push({
        type: 'urgent',
        message: 'Contact insurance company to report claim',
        deadline: 'Immediately',
        action: 'Call insurance company and get claim number'
      });
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      reminders,
      nextDeadline: getNextDeadline(claimType, userProgress),
      recommendations: getReminderRecommendations(reminders.length)
    })
  };
}

function getNextDeadline(claimType, userProgress) {
  const deadlines = {
    property: 'Proof of Loss due in 60 days',
    auto: 'Proof of Loss due in 30 days',
    health: 'Appeal deadline varies by state'
  };
  
  return deadlines[claimType] || 'Check your policy for specific deadlines';
}

function getReminderRecommendations(reminderCount) {
  if (reminderCount === 0) {
    return ['Great job! You\'re on track with your documentation.'];
  } else if (reminderCount <= 2) {
    return ['Focus on completing urgent items first.', 'Set aside time each day for documentation.'];
  } else {
    return ['Prioritize critical documentation items.', 'Consider getting help from a public adjuster.', 'Don\'t delay - some evidence may be lost over time.'];
  }
}

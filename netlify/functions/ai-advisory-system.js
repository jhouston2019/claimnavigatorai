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
      userResponses = {},
      currentStep = 1,
      situationType = null
    } = requestData;

    console.log("AI Advisory System - Action:", action);

    if (action === 'get-questions') {
      return getDiagnosticQuestions(currentStep, userResponses);
    } else if (action === 'analyze-responses') {
      return analyzeUserResponses(userResponses);
    } else if (action === 'get-advisory') {
      return getAdvisoryRecommendations(situationType, userResponses);
    } else if (action === 'get-next-steps') {
      return getNextSteps(situationType, userResponses);
    } else if (action === 'get-tool-suggestions') {
      return getToolSuggestions(situationType, userResponses);
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
    console.error("Error in ai-advisory-system:", error);
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

function getDiagnosticQuestions(currentStep, userResponses) {
  const allQuestions = [
    {
      id: 'claim-type',
      step: 1,
      question: 'What type of insurance claim are you dealing with?',
      type: 'single-choice',
      options: [
        { value: 'property', label: 'Property (Home, Business, Rental)', icon: '🏠' },
        { value: 'auto', label: 'Auto (Vehicle, Motorcycle, Commercial)', icon: '🚗' },
        { value: 'health', label: 'Health Insurance', icon: '🏥' },
        { value: 'life', label: 'Life Insurance', icon: '💼' },
        { value: 'disability', label: 'Disability Insurance', icon: '♿' }
      ],
      required: true,
      helpText: 'This helps us provide the most relevant advice for your specific situation.'
    },
    {
      id: 'claim-stage',
      step: 2,
      question: 'What stage is your claim currently in?',
      type: 'single-choice',
      options: [
        { value: 'not-started', label: 'Haven\'t started yet - need guidance', icon: '🚀' },
        { value: 'just-filed', label: 'Just filed - waiting for response', icon: '📋' },
        { value: 'in-progress', label: 'In progress - adjuster assigned', icon: '🔄' },
        { value: 'inspection-scheduled', label: 'Inspection scheduled', icon: '🔍' },
        { value: 'estimate-received', label: 'Received estimate/offer', icon: '💰' },
        { value: 'negotiating', label: 'Negotiating settlement', icon: '🤝' },
        { value: 'denied', label: 'Claim denied', icon: '❌' },
        { value: 'delayed', label: 'Claim delayed/stalled', icon: '⏰' }
      ],
      required: true,
      helpText: 'Understanding your current stage helps us provide stage-specific guidance.'
    },
    {
      id: 'main-concern',
      step: 3,
      question: 'What is your biggest concern or challenge right now?',
      type: 'single-choice',
      options: [
        { value: 'denial', label: 'Claim was denied', icon: '❌' },
        { value: 'lowball', label: 'Low settlement offer', icon: '💰' },
        { value: 'delays', label: 'Processing delays', icon: '⏰' },
        { value: 'coverage', label: 'Coverage questions', icon: '📋' },
        { value: 'documentation', label: 'Documentation issues', icon: '📄' },
        { value: 'communication', label: 'Poor communication', icon: '📞' },
        { value: 'complexity', label: 'Complex claim situation', icon: '🧩' },
        { value: 'timeline', label: 'Urgent timeline', icon: '🚨' }
      ],
      required: true,
      helpText: 'This helps us prioritize the most important actions for your situation.'
    },
    {
      id: 'timeline',
      step: 4,
      question: 'How urgent is your situation?',
      type: 'single-choice',
      options: [
        { value: 'critical', label: 'Critical - immediate action needed', icon: '🚨' },
        { value: 'urgent', label: 'Urgent - within 1 week', icon: '⚠️' },
        { value: 'moderate', label: 'Moderate - within 1 month', icon: '📅' },
        { value: 'flexible', label: 'Flexible timeline', icon: '🕐' }
      ],
      required: true,
      helpText: 'This helps us prioritize actions and suggest appropriate timelines.'
    },
    {
      id: 'insurance-response',
      step: 5,
      question: 'What has your insurance company said or done?',
      type: 'multi-choice',
      options: [
        { value: 'no-response', label: 'No response yet', icon: '🔇' },
        { value: 'acknowledged', label: 'Acknowledged claim', icon: '✅' },
        { value: 'assigned-adjuster', label: 'Assigned adjuster', icon: '👤' },
        { value: 'scheduled-inspection', label: 'Scheduled inspection', icon: '🔍' },
        { value: 'requested-docs', label: 'Requested documents', icon: '📄' },
        { value: 'made-offer', label: 'Made settlement offer', icon: '💰' },
        { value: 'denied-claim', label: 'Denied claim', icon: '❌' },
        { value: 'delayed-processing', label: 'Delayed processing', icon: '⏰' }
      ],
      required: true,
      helpText: 'Understanding the insurance company\'s actions helps us determine next steps.'
    },
    {
      id: 'policy-coverage',
      step: 6,
      question: 'Do you have questions about your policy coverage?',
      type: 'single-choice',
      options: [
        { value: 'yes-unsure', label: 'Yes - not sure what\'s covered', icon: '❓' },
        { value: 'yes-dispute', label: 'Yes - coverage dispute', icon: '⚖️' },
        { value: 'yes-limits', label: 'Yes - coverage limits', icon: '📊' },
        { value: 'no-clear', label: 'No - coverage is clear', icon: '✅' }
      ],
      required: true,
      helpText: 'Policy coverage questions often affect claim strategy and documentation needs.'
    },
    {
      id: 'previous-actions',
      step: 7,
      question: 'What actions have you already taken?',
      type: 'multi-choice',
      options: [
        { value: 'contacted-insurance', label: 'Contacted insurance company', icon: '📞' },
        { value: 'filed-claim', label: 'Filed claim', icon: '📋' },
        { value: 'documented-damage', label: 'Documented damage', icon: '📸' },
        { value: 'obtained-estimates', label: 'Obtained repair estimates', icon: '💰' },
        { value: 'hired-professional', label: 'Hired public adjuster/attorney', icon: '👨‍💼' },
        { value: 'submitted-docs', label: 'Submitted documentation', icon: '📄' },
        { value: 'negotiated', label: 'Attempted negotiation', icon: '🤝' },
        { value: 'none', label: 'None yet', icon: '🚀' }
      ],
      required: true,
      helpText: 'This helps us avoid duplicating efforts and focus on next steps.'
    },
    {
      id: 'experience-level',
      step: 8,
      question: 'How would you describe your experience with insurance claims?',
      type: 'single-choice',
      options: [
        { value: 'first-time', label: 'First time - need guidance', icon: '🆕' },
        { value: 'some-experience', label: 'Some experience - had claims before', icon: '📚' },
        { value: 'experienced', label: 'Experienced - know the process', icon: '🎯' },
        { value: 'professional', label: 'Professional - work in insurance', icon: '👨‍💼' }
      ],
      required: true,
      helpText: 'Your experience level helps us tailor our advice and tool suggestions.'
    },
    {
      id: 'help-needed',
      step: 9,
      question: 'What type of help do you need most?',
      type: 'multi-choice',
      options: [
        { value: 'documentation', label: 'Documentation guidance', icon: '📄' },
        { value: 'negotiation', label: 'Negotiation strategies', icon: '🤝' },
        { value: 'legal-advice', label: 'Legal guidance', icon: '⚖️' },
        { value: 'professional-help', label: 'Professional referrals', icon: '👨‍💼' },
        { value: 'timeline-guidance', label: 'Timeline and deadlines', icon: '⏰' },
        { value: 'policy-analysis', label: 'Policy analysis', icon: '📋' },
        { value: 'appeal-process', label: 'Appeal process', icon: '🔄' },
        { value: 'general-guidance', label: 'General claim guidance', icon: '💡' }
      ],
      required: true,
      helpText: 'This helps us prioritize the tools and resources most relevant to your needs.'
    },
    {
      id: 'budget-constraints',
      step: 10,
      question: 'Do you have budget constraints for professional help?',
      type: 'single-choice',
      options: [
        { value: 'no-budget', label: 'No budget for professionals', icon: '💰' },
        { value: 'limited-budget', label: 'Limited budget', icon: '💸' },
        { value: 'moderate-budget', label: 'Moderate budget available', icon: '💵' },
        { value: 'flexible-budget', label: 'Flexible budget', icon: '💎' }
      ],
      required: true,
      helpText: 'This helps us suggest appropriate resources and professional options.'
    }
  ];

  // Filter questions based on current step and previous responses
  const filteredQuestions = allQuestions.filter(q => q.step === currentStep);
  
  // Add conditional questions based on previous responses
  if (userResponses['claim-type'] === 'property' && currentStep === 6) {
    filteredQuestions.push({
      id: 'property-damage-type',
      step: 6,
      question: 'What type of property damage occurred?',
      type: 'single-choice',
      options: [
        { value: 'fire', label: 'Fire damage', icon: '🔥' },
        { value: 'water', label: 'Water damage', icon: '💧' },
        { value: 'storm', label: 'Storm damage', icon: '⛈️' },
        { value: 'theft', label: 'Theft/vandalism', icon: '🔒' },
        { value: 'other', label: 'Other damage', icon: '🔧' }
      ],
      required: true,
      helpText: 'Different types of damage require different documentation and strategies.'
    });
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      questions: filteredQuestions,
      currentStep,
      totalSteps: 10,
      progress: Math.round((currentStep / 10) * 100),
      nextStep: currentStep < 10 ? currentStep + 1 : null
    })
  };
}

function analyzeUserResponses(userResponses) {
  const analysis = {
    situationType: determineSituationType(userResponses),
    urgencyLevel: determineUrgencyLevel(userResponses),
    complexityLevel: determineComplexityLevel(userResponses),
    recommendedApproach: determineRecommendedApproach(userResponses),
    keyIssues: identifyKeyIssues(userResponses),
    timelineFactors: identifyTimelineFactors(userResponses)
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
      situationSummary: generateSituationSummary(analysis),
      priorityActions: generatePriorityActions(analysis)
    })
  };
}

function determineSituationType(userResponses) {
  const claimType = userResponses['claim-type'];
  const mainConcern = userResponses['main-concern'];
  const claimStage = userResponses['claim-stage'];

  // Complex logic to determine situation type
  if (mainConcern === 'denial') {
    return 'claim-denied';
  } else if (mainConcern === 'lowball') {
    return 'lowball-offer';
  } else if (mainConcern === 'delays') {
    return 'processing-delays';
  } else if (mainConcern === 'coverage') {
    return 'coverage-dispute';
  } else if (claimStage === 'not-started') {
    return 'first-time-filer';
  } else if (claimStage === 'denied') {
    return 'claim-denied';
  } else if (claimStage === 'delayed') {
    return 'processing-delays';
  } else {
    return 'general-claim-guidance';
  }
}

function determineUrgencyLevel(userResponses) {
  const timeline = userResponses['timeline'];
  const mainConcern = userResponses['main-concern'];
  
  if (timeline === 'critical' || mainConcern === 'timeline') {
    return 'critical';
  } else if (timeline === 'urgent' || mainConcern === 'denial') {
    return 'high';
  } else if (timeline === 'moderate') {
    return 'medium';
  } else {
    return 'low';
  }
}

function determineComplexityLevel(userResponses) {
  const claimType = userResponses['claim-type'];
  const mainConcern = userResponses['main-concern'];
  const experienceLevel = userResponses['experience-level'];
  
  let complexity = 'simple';
  
  if (claimType === 'health' || claimType === 'life') {
    complexity = 'complex';
  } else if (mainConcern === 'complexity' || mainConcern === 'coverage') {
    complexity = 'complex';
  } else if (experienceLevel === 'first-time') {
    complexity = 'moderate';
  }
  
  return complexity;
}

function determineRecommendedApproach(userResponses) {
  const experienceLevel = userResponses['experience-level'];
  const budgetConstraints = userResponses['budget-constraints'];
  const complexityLevel = determineComplexityLevel(userResponses);
  
  if (experienceLevel === 'first-time' && complexityLevel === 'complex') {
    return 'professional-help-recommended';
  } else if (budgetConstraints === 'no-budget' || budgetConstraints === 'limited-budget') {
    return 'diy-with-tools';
  } else if (complexityLevel === 'complex') {
    return 'hybrid-approach';
  } else {
    return 'diy-with-guidance';
  }
}

function identifyKeyIssues(userResponses) {
  const issues = [];
  const mainConcern = userResponses['main-concern'];
  const insuranceResponse = userResponses['insurance-response'];
  const policyCoverage = userResponses['policy-coverage'];
  
  if (mainConcern === 'denial') {
    issues.push('Claim denial requires immediate appeal');
  }
  if (mainConcern === 'lowball') {
    issues.push('Settlement offer appears inadequate');
  }
  if (mainConcern === 'delays') {
    issues.push('Processing delays may violate state regulations');
  }
  if (policyCoverage === 'yes-unsure' || policyCoverage === 'yes-dispute') {
    issues.push('Policy coverage questions need resolution');
  }
  if (insuranceResponse && insuranceResponse.includes('no-response')) {
    issues.push('No response from insurance company');
  }
  
  return issues;
}

function identifyTimelineFactors(userResponses) {
  const factors = [];
  const timeline = userResponses['timeline'];
  const claimStage = userResponses['claim-stage'];
  
  if (timeline === 'critical') {
    factors.push('Immediate action required');
  }
  if (claimStage === 'denied') {
    factors.push('Appeal deadlines may be approaching');
  }
  if (claimStage === 'delayed') {
    factors.push('State deadline violations possible');
  }
  
  return factors;
}

function generateSituationSummary(analysis) {
  const summaries = {
    'claim-denied': 'Your claim has been denied and requires immediate attention. We\'ll help you understand why it was denied and create an appeal strategy.',
    'lowball-offer': 'You\'ve received a settlement offer that appears to be significantly below the actual value of your claim. We\'ll help you negotiate for a fair settlement.',
    'processing-delays': 'Your claim is experiencing delays that may violate state regulations. We\'ll help you understand your rights and take appropriate action.',
    'coverage-dispute': 'There are questions about what your policy covers. We\'ll help you understand your coverage and resolve any disputes.',
    'first-time-filer': 'This is your first insurance claim. We\'ll guide you through the entire process step by step.',
    'general-claim-guidance': 'You need general guidance on your insurance claim. We\'ll provide comprehensive support for your situation.'
  };
  
  return summaries[analysis.situationType] || 'We\'ll provide personalized guidance based on your specific situation.';
}

function generatePriorityActions(analysis) {
  const actions = {
    'claim-denied': [
      'Review denial letter for specific reasons',
      'Gather additional supporting documentation',
      'Prepare appeal letter',
      'Consider professional representation'
    ],
    'lowball-offer': [
      'Obtain independent estimates',
      'Review settlement comparison tools',
      'Prepare counter-offer',
      'Document all damages thoroughly'
    ],
    'processing-delays': [
      'Document all delays and communications',
      'Review state deadline requirements',
      'Send formal delay complaint',
      'Consider DOI complaint'
    ],
    'coverage-dispute': [
      'Analyze policy language',
      'Gather supporting documentation',
      'Request coverage clarification',
      'Consider legal review'
    ],
    'first-time-filer': [
      'Understand your policy coverage',
      'Document everything immediately',
      'Follow proper claim procedures',
      'Track all communications'
    ]
  };
  
  return actions[analysis.situationType] || [
    'Review your situation',
    'Gather necessary documentation',
    'Follow recommended procedures',
    'Monitor progress regularly'
  ];
}

function getAdvisoryRecommendations(situationType, userResponses) {
  const recommendations = {
    'claim-denied': {
      title: 'Claim Denial - Immediate Action Required',
      priority: 'critical',
      summary: 'Your claim has been denied. Immediate action is required to preserve your rights and appeal the decision.',
      actions: [
        {
          title: 'Review Denial Letter',
          description: 'Carefully read the denial letter to understand the specific reasons for denial.',
          priority: 'critical',
          timeline: 'Immediately',
          tools: ['Policy Analyzer', 'Document Generator']
        },
        {
          title: 'Gather Supporting Evidence',
          description: 'Collect additional documentation to support your claim.',
          priority: 'high',
          timeline: 'Within 3 days',
          tools: ['Evidence Organizer', 'Documentation Checklist']
        },
        {
          title: 'Prepare Appeal Letter',
          description: 'Draft a professional appeal letter addressing the denial reasons.',
          priority: 'high',
          timeline: 'Within 7 days',
          tools: ['Document Generator', 'AI Response Agent']
        },
        {
          title: 'Consider Professional Help',
          description: 'Evaluate whether to hire a public adjuster or attorney.',
          priority: 'medium',
          timeline: 'Within 10 days',
          tools: ['Professional Marketplace', 'Financial Calculator']
        }
      ],
      nextSteps: [
        'File appeal within deadline',
        'Request policy review',
        'Document all communications',
        'Prepare for potential litigation'
      ],
      tools: ['Appeal Builder', 'Policy Analyzer', 'Document Generator', 'Professional Marketplace']
    },
    'lowball-offer': {
      title: 'Lowball Settlement Offer - Negotiation Strategy',
      priority: 'high',
      summary: 'You\'ve received a settlement offer that appears to be significantly below the actual value of your claim.',
      actions: [
        {
          title: 'Analyze Settlement Offer',
          description: 'Compare the offer to your actual damages and independent estimates.',
          priority: 'high',
          timeline: 'Within 2 days',
          tools: ['Settlement Comparison', 'Financial Calculator']
        },
        {
          title: 'Obtain Independent Estimates',
          description: 'Get professional estimates to support your claim value.',
          priority: 'high',
          timeline: 'Within 5 days',
          tools: ['Professional Marketplace', 'Documentation Checklist']
        },
        {
          title: 'Prepare Counter-Offer',
          description: 'Draft a professional counter-offer with supporting documentation.',
          priority: 'high',
          timeline: 'Within 7 days',
          tools: ['Document Generator', 'Negotiation Scripts']
        },
        {
          title: 'Document All Damages',
          description: 'Ensure all damages are properly documented and valued.',
          priority: 'medium',
          timeline: 'Within 10 days',
          tools: ['Evidence Organizer', 'Documentation Checklist']
        }
      ],
      nextSteps: [
        'Submit counter-offer with evidence',
        'Negotiate professionally',
        'Consider appraisal if needed',
        'Prepare for potential litigation'
      ],
      tools: ['Settlement Comparison', 'Financial Calculator', 'Document Generator', 'Negotiation Scripts']
    },
    'processing-delays': {
      title: 'Processing Delays - Regulatory Action',
      priority: 'high',
      summary: 'Your claim is experiencing delays that may violate state regulations and your rights.',
      actions: [
        {
          title: 'Document All Delays',
          description: 'Create a detailed timeline of all delays and communications.',
          priority: 'high',
          timeline: 'Immediately',
          tools: ['Claim Timeline Tracker', 'Documentation Checklist']
        },
        {
          title: 'Review State Deadlines',
          description: 'Check state regulations for processing time requirements.',
          priority: 'high',
          timeline: 'Within 1 day',
          tools: ['Deadline Tracker', 'State Rights']
        },
        {
          title: 'Send Delay Complaint',
          description: 'Send formal complaint about processing delays.',
          priority: 'high',
          timeline: 'Within 3 days',
          tools: ['Document Generator', 'Negotiation Scripts']
        },
        {
          title: 'Consider DOI Complaint',
          description: 'File complaint with state insurance department if needed.',
          priority: 'medium',
          timeline: 'Within 10 days',
          tools: ['State Rights', 'Document Generator']
        }
      ],
      nextSteps: [
        'Monitor response to complaint',
        'Escalate if no response',
        'Document all communications',
        'Prepare for potential legal action'
      ],
      tools: ['Deadline Tracker', 'Document Generator', 'State Rights', 'Negotiation Scripts']
    },
    'coverage-dispute': {
      title: 'Coverage Dispute - Policy Analysis Required',
      priority: 'high',
      summary: 'There are questions about what your policy covers. We need to analyze your policy and resolve the dispute.',
      actions: [
        {
          title: 'Analyze Policy Language',
          description: 'Review your policy to understand coverage terms and exclusions.',
          priority: 'high',
          timeline: 'Within 2 days',
          tools: ['Policy Analyzer', 'AI Policy Analyzer']
        },
        {
          title: 'Gather Supporting Documentation',
          description: 'Collect evidence to support coverage position.',
          priority: 'high',
          timeline: 'Within 5 days',
          tools: ['Evidence Organizer', 'Documentation Checklist']
        },
        {
          title: 'Request Coverage Clarification',
          description: 'Send formal request for coverage clarification.',
          priority: 'high',
          timeline: 'Within 7 days',
          tools: ['Document Generator', 'Negotiation Scripts']
        },
        {
          title: 'Consider Legal Review',
          description: 'Have policy reviewed by legal professional if needed.',
          priority: 'medium',
          timeline: 'Within 10 days',
          tools: ['Professional Marketplace', 'Financial Calculator']
        }
      ],
      nextSteps: [
        'Review insurer response',
        'Negotiate coverage terms',
        'Document all communications',
        'Prepare for potential litigation'
      ],
      tools: ['Policy Analyzer', 'Document Generator', 'Professional Marketplace', 'Negotiation Scripts']
    },
    'first-time-filer': {
      title: 'First-Time Claim - Complete Guidance',
      priority: 'medium',
      summary: 'This is your first insurance claim. We\'ll provide comprehensive guidance through the entire process.',
      actions: [
        {
          title: 'Understand Your Policy',
          description: 'Learn about your coverage, limits, and deductibles.',
          priority: 'high',
          timeline: 'Within 1 day',
          tools: ['Policy Analyzer', 'AI Policy Analyzer']
        },
        {
          title: 'Document Everything Immediately',
          description: 'Start documenting damage and expenses right away.',
          priority: 'high',
          timeline: 'Immediately',
          tools: ['Documentation Checklist', 'Evidence Organizer']
        },
        {
          title: 'File Claim Properly',
          description: 'Follow proper procedures for filing your claim.',
          priority: 'high',
          timeline: 'Within 2 days',
          tools: ['Claim Timeline Tracker', 'Document Generator']
        },
        {
          title: 'Track Progress',
          description: 'Monitor your claim progress and deadlines.',
          priority: 'medium',
          timeline: 'Ongoing',
          tools: ['Claim Timeline Tracker', 'Deadline Tracker']
        }
      ],
      nextSteps: [
        'Follow claim timeline',
        'Respond to requests promptly',
        'Keep detailed records',
        'Ask questions when needed'
      ],
      tools: ['Policy Analyzer', 'Documentation Checklist', 'Claim Timeline Tracker', 'Deadline Tracker']
    }
  };

  const recommendation = recommendations[situationType] || {
    title: 'General Claim Guidance',
    priority: 'medium',
    summary: 'We\'ll provide comprehensive guidance for your insurance claim situation.',
    actions: [
      {
        title: 'Review Your Situation',
        description: 'Analyze your current claim status and needs.',
        priority: 'high',
        timeline: 'Within 1 day',
        tools: ['Claim Analysis', 'Policy Analyzer']
      },
      {
        title: 'Gather Documentation',
        description: 'Collect all necessary documentation for your claim.',
        priority: 'high',
        timeline: 'Within 3 days',
        tools: ['Documentation Checklist', 'Evidence Organizer']
      },
      {
        title: 'Follow Best Practices',
        description: 'Use recommended tools and strategies for your claim.',
        priority: 'medium',
        timeline: 'Ongoing',
        tools: ['Claim Timeline Tracker', 'Negotiation Scripts']
      }
    ],
    nextSteps: [
      'Monitor claim progress',
      'Use recommended tools',
      'Follow best practices',
      'Seek help when needed'
    ],
    tools: ['Policy Analyzer', 'Documentation Checklist', 'Claim Timeline Tracker', 'Negotiation Scripts']
  };

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      recommendation,
      situationType,
      generatedAt: new Date().toISOString()
    })
  };
}

function getNextSteps(situationType, userResponses) {
  const nextSteps = {
    'claim-denied': [
      'Review denial letter immediately',
      'Gather additional evidence',
      'Prepare appeal letter',
      'Consider professional help',
      'File appeal within deadline'
    ],
    'lowball-offer': [
      'Analyze settlement offer',
      'Obtain independent estimates',
      'Prepare counter-offer',
      'Negotiate professionally',
      'Consider appraisal if needed'
    ],
    'processing-delays': [
      'Document all delays',
      'Review state deadlines',
      'Send delay complaint',
      'Consider DOI complaint',
      'Monitor response'
    ],
    'coverage-dispute': [
      'Analyze policy language',
      'Gather supporting evidence',
      'Request coverage clarification',
      'Negotiate coverage terms',
      'Consider legal review'
    ],
    'first-time-filer': [
      'Understand your policy',
      'Document everything',
      'File claim properly',
      'Track progress',
      'Follow timeline'
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
      nextSteps: nextSteps[situationType] || [
        'Review your situation',
        'Gather documentation',
        'Follow best practices',
        'Monitor progress',
        'Seek help when needed'
      ],
      situationType
    })
  };
}

function getToolSuggestions(situationType, userResponses) {
  const toolSuggestions = {
    'claim-denied': [
      { tool: 'Policy Analyzer', priority: 'high', reason: 'Analyze policy for coverage issues' },
      { tool: 'Document Generator', priority: 'high', reason: 'Create appeal letter' },
      { tool: 'Evidence Organizer', priority: 'high', reason: 'Organize supporting evidence' },
      { tool: 'Professional Marketplace', priority: 'medium', reason: 'Find legal representation' },
      { tool: 'Deadline Tracker', priority: 'high', reason: 'Track appeal deadlines' }
    ],
    'lowball-offer': [
      { tool: 'Settlement Comparison', priority: 'high', reason: 'Compare offer to damages' },
      { tool: 'Financial Calculator', priority: 'high', reason: 'Calculate true claim value' },
      { tool: 'Document Generator', priority: 'high', reason: 'Create counter-offer letter' },
      { tool: 'Negotiation Scripts', priority: 'medium', reason: 'Professional negotiation' },
      { tool: 'Professional Marketplace', priority: 'medium', reason: 'Find negotiation help' }
    ],
    'processing-delays': [
      { tool: 'Deadline Tracker', priority: 'high', reason: 'Track state deadlines' },
      { tool: 'Document Generator', priority: 'high', reason: 'Create delay complaint' },
      { tool: 'State Rights', priority: 'high', reason: 'Understand your rights' },
      { tool: 'Claim Timeline Tracker', priority: 'medium', reason: 'Document delays' },
      { tool: 'Negotiation Scripts', priority: 'medium', reason: 'Professional communication' }
    ],
    'coverage-dispute': [
      { tool: 'Policy Analyzer', priority: 'high', reason: 'Analyze policy language' },
      { tool: 'Document Generator', priority: 'high', reason: 'Create coverage request' },
      { tool: 'Evidence Organizer', priority: 'medium', reason: 'Organize supporting docs' },
      { tool: 'Professional Marketplace', priority: 'medium', reason: 'Find legal help' },
      { tool: 'Negotiation Scripts', priority: 'medium', reason: 'Professional communication' }
    ],
    'first-time-filer': [
      { tool: 'Policy Analyzer', priority: 'high', reason: 'Understand your coverage' },
      { tool: 'Documentation Checklist', priority: 'high', reason: 'Complete documentation' },
      { tool: 'Claim Timeline Tracker', priority: 'high', reason: 'Follow claim process' },
      { tool: 'Deadline Tracker', priority: 'medium', reason: 'Track important deadlines' },
      { tool: 'Evidence Organizer', priority: 'medium', reason: 'Organize evidence' }
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
      toolSuggestions: toolSuggestions[situationType] || [
        { tool: 'Policy Analyzer', priority: 'high', reason: 'Understand your coverage' },
        { tool: 'Documentation Checklist', priority: 'high', reason: 'Complete documentation' },
        { tool: 'Claim Timeline Tracker', priority: 'medium', reason: 'Follow claim process' },
        { tool: 'Deadline Tracker', priority: 'medium', reason: 'Track important deadlines' }
      ],
      situationType
    })
  };
}

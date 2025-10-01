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
      situationType,
      userResponses = {},
      documentType = null,
      templateData = {}
    } = requestData;

    console.log("Document Generator Integration - Action:", action);

    if (action === 'get-suggested-documents') {
      return getSuggestedDocuments(situationType, userResponses);
    } else if (action === 'get-document-sequence') {
      return getDocumentSequence(situationType, userResponses);
    } else if (action === 'pre-populate-template') {
      return prePopulateTemplate(documentType, userResponses, templateData);
    } else if (action === 'get-related-documents') {
      return getRelatedDocuments(documentType, situationType);
    } else if (action === 'validate-document-data') {
      return validateDocumentData(documentType, templateData);
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
    console.error("Error in document-generator-integration:", error);
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

function getSuggestedDocuments(situationType, userResponses) {
  const documentSuggestions = {
    'claim-denied': {
      primary: [
        {
          type: 'appeal-letter',
          title: 'Appeal Letter',
          description: 'Professional appeal letter addressing denial reasons',
          priority: 'critical',
          timeline: 'Immediately',
          autoPopulate: true,
          requiredFields: ['denialReasons', 'supportingEvidence', 'policyReferences']
        },
        {
          type: 'proof-of-loss',
          title: 'Proof of Loss Statement',
          description: 'Sworn statement of damages with supporting documentation',
          priority: 'high',
          timeline: 'Within 3 days',
          autoPopulate: true,
          requiredFields: ['damageDescription', 'itemizedLosses', 'supportingEvidence']
        },
        {
          type: 'policy-analysis',
          title: 'Policy Coverage Analysis',
          description: 'Detailed analysis of policy language and coverage',
          priority: 'high',
          timeline: 'Within 5 days',
          autoPopulate: false,
          requiredFields: ['policyLanguage', 'coverageTerms', 'exclusions']
        }
      ],
      secondary: [
        {
          type: 'demand-letter',
          title: 'Demand Letter',
          description: 'Formal demand for payment based on policy terms',
          priority: 'medium',
          timeline: 'Within 7 days',
          autoPopulate: true,
          requiredFields: ['claimAmount', 'policyReferences', 'deadline']
        },
        {
          type: 'notice-of-delay',
          title: 'Notice of Delay Complaint',
          description: 'Complaint about processing delays and violations',
          priority: 'medium',
          timeline: 'Within 10 days',
          autoPopulate: true,
          requiredFields: ['delayTimeline', 'stateRegulations', 'violations']
        }
      ]
    },
    'lowball-offer': {
      primary: [
        {
          type: 'settlement-comparison',
          title: 'Settlement Comparison Analysis',
          description: 'Detailed comparison of offer vs. actual damages',
          priority: 'critical',
          timeline: 'Within 2 days',
          autoPopulate: true,
          requiredFields: ['insurerOffer', 'actualDamages', 'independentEstimates']
        },
        {
          type: 'counter-offer-letter',
          title: 'Counter-Offer Letter',
          description: 'Professional counter-offer with supporting evidence',
          priority: 'high',
          timeline: 'Within 5 days',
          autoPopulate: true,
          requiredFields: ['counterOfferAmount', 'supportingEvidence', 'deadline']
        },
        {
          type: 'damage-inventory',
          title: 'Comprehensive Damage Inventory',
          description: 'Detailed inventory of all damages with values',
          priority: 'high',
          timeline: 'Within 3 days',
          autoPopulate: true,
          requiredFields: ['itemizedDamages', 'replacementCosts', 'repairCosts']
        }
      ],
      secondary: [
        {
          type: 'appraisal-demand',
          title: 'Appraisal Demand Letter',
          description: 'Formal request for appraisal under policy terms',
          priority: 'medium',
          timeline: 'Within 7 days',
          autoPopulate: true,
          requiredFields: ['policyAppraisalClause', 'disputeAmount', 'deadline']
        },
        {
          type: 'expert-opinion',
          title: 'Expert Opinion Letter',
          description: 'Professional opinion supporting claim value',
          priority: 'medium',
          timeline: 'Within 10 days',
          autoPopulate: false,
          requiredFields: ['expertQualifications', 'opinionBasis', 'supportingData']
        }
      ]
    },
    'processing-delays': {
      primary: [
        {
          type: 'delay-complaint',
          title: 'Processing Delay Complaint',
          description: 'Formal complaint about processing delays',
          priority: 'critical',
          timeline: 'Immediately',
          autoPopulate: true,
          requiredFields: ['delayTimeline', 'stateRegulations', 'violations']
        },
        {
          type: 'deadline-notice',
          title: 'Deadline Notice',
          description: 'Notice of approaching deadlines and requirements',
          priority: 'high',
          timeline: 'Within 2 days',
          autoPopulate: true,
          requiredFields: ['deadlineDate', 'requirements', 'consequences']
        },
        {
          type: 'doi-complaint',
          title: 'DOI Complaint Letter',
          description: 'Complaint to state insurance department',
          priority: 'high',
          timeline: 'Within 5 days',
          autoPopulate: true,
          requiredFields: ['violations', 'stateRegulations', 'requestedAction']
        }
      ],
      secondary: [
        {
          type: 'follow-up-letter',
          title: 'Follow-up Letter',
          description: 'Professional follow-up on claim status',
          priority: 'medium',
          timeline: 'Within 3 days',
          autoPopulate: true,
          requiredFields: ['claimStatus', 'nextSteps', 'deadline']
        },
        {
          type: 'escalation-notice',
          title: 'Escalation Notice',
          description: 'Notice of intent to escalate if no response',
          priority: 'medium',
          timeline: 'Within 7 days',
          autoPopulate: true,
          requiredFields: ['escalationTimeline', 'nextSteps', 'consequences']
        }
      ]
    },
    'coverage-dispute': {
      primary: [
        {
          type: 'coverage-clarification',
          title: 'Coverage Clarification Request',
          description: 'Formal request for coverage clarification',
          priority: 'critical',
          timeline: 'Immediately',
          autoPopulate: true,
          requiredFields: ['coverageQuestions', 'policyLanguage', 'supportingEvidence']
        },
        {
          type: 'policy-analysis',
          title: 'Policy Coverage Analysis',
          description: 'Detailed analysis of policy language and coverage',
          priority: 'high',
          timeline: 'Within 3 days',
          autoPopulate: false,
          requiredFields: ['policyLanguage', 'coverageTerms', 'exclusions']
        },
        {
          type: 'coverage-position',
          title: 'Coverage Position Letter',
          description: 'Formal statement of coverage position',
          priority: 'high',
          timeline: 'Within 5 days',
          autoPopulate: true,
          requiredFields: ['coveragePosition', 'supportingEvidence', 'legalBasis']
        }
      ],
      secondary: [
        {
          type: 'legal-opinion',
          title: 'Legal Opinion Request',
          description: 'Request for legal opinion on coverage',
          priority: 'medium',
          timeline: 'Within 7 days',
          autoPopulate: false,
          requiredFields: ['legalQuestions', 'policyLanguage', 'supportingEvidence']
        },
        {
          type: 'mediation-request',
          title: 'Mediation Request',
          description: 'Request for mediation to resolve coverage dispute',
          priority: 'medium',
          timeline: 'Within 10 days',
          autoPopulate: true,
          requiredFields: ['disputeSummary', 'mediationRequest', 'timeline']
        }
      ]
    },
    'first-time-filer': {
      primary: [
        {
          type: 'notice-of-claim',
          title: 'Notice of Claim',
          description: 'Initial claim notification to insurance company',
          priority: 'critical',
          timeline: 'Immediately',
          autoPopulate: true,
          requiredFields: ['lossDate', 'lossDescription', 'damageLocation']
        },
        {
          type: 'damage-inventory',
          title: 'Damage Inventory Sheet',
          description: 'Comprehensive inventory of all damages',
          priority: 'high',
          timeline: 'Within 2 days',
          autoPopulate: true,
          requiredFields: ['itemizedDamages', 'damagePhotos', 'estimatedValues']
        },
        {
          type: 'claim-timeline',
          title: 'Claim Timeline/Diary',
          description: 'Chronological log of claim events',
          priority: 'high',
          timeline: 'Ongoing',
          autoPopulate: true,
          requiredFields: ['eventDate', 'eventDescription', 'participants']
        }
      ],
      secondary: [
        {
          type: 'proof-of-loss',
          title: 'Proof of Loss Statement',
          description: 'Sworn statement of damages',
          priority: 'medium',
          timeline: 'Within 5 days',
          autoPopulate: true,
          requiredFields: ['damageDescription', 'itemizedLosses', 'supportingEvidence']
        },
        {
          type: 'expense-log',
          title: 'Out-of-Pocket Expense Log',
          description: 'Track all expenses related to the claim',
          priority: 'medium',
          timeline: 'Ongoing',
          autoPopulate: true,
          requiredFields: ['expenseDate', 'expenseDescription', 'amount', 'receipt']
        }
      ]
    }
  };

  const suggestions = documentSuggestions[situationType] || {
    primary: [
      {
        type: 'general-claim-letter',
        title: 'General Claim Letter',
        description: 'Professional claim letter template',
        priority: 'high',
        timeline: 'Within 3 days',
        autoPopulate: true,
        requiredFields: ['claimDescription', 'damageAmount', 'supportingEvidence']
      }
    ],
    secondary: [
      {
        type: 'follow-up-letter',
        title: 'Follow-up Letter',
        description: 'Professional follow-up on claim status',
        priority: 'medium',
        timeline: 'Within 5 days',
        autoPopulate: true,
        requiredFields: ['claimStatus', 'nextSteps', 'deadline']
      }
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
      suggestions,
      situationType,
      totalDocuments: suggestions.primary.length + suggestions.secondary.length,
      criticalDocuments: suggestions.primary.filter(doc => doc.priority === 'critical').length
    })
  };
}

function getDocumentSequence(situationType, userResponses) {
  const sequences = {
    'claim-denied': [
      {
        step: 1,
        document: 'appeal-letter',
        title: 'Appeal Letter',
        description: 'Immediate appeal of denial decision',
        timeline: 'Immediately',
        dependencies: [],
        autoPopulate: true
      },
      {
        step: 2,
        document: 'proof-of-loss',
        title: 'Proof of Loss Statement',
        description: 'Sworn statement with supporting evidence',
        timeline: 'Within 3 days',
        dependencies: ['appeal-letter'],
        autoPopulate: true
      },
      {
        step: 3,
        document: 'policy-analysis',
        title: 'Policy Coverage Analysis',
        description: 'Detailed analysis of policy language',
        timeline: 'Within 5 days',
        dependencies: ['appeal-letter'],
        autoPopulate: false
      },
      {
        step: 4,
        document: 'demand-letter',
        title: 'Demand Letter',
        description: 'Formal demand for payment',
        timeline: 'Within 7 days',
        dependencies: ['proof-of-loss', 'policy-analysis'],
        autoPopulate: true
      }
    ],
    'lowball-offer': [
      {
        step: 1,
        document: 'settlement-comparison',
        title: 'Settlement Comparison Analysis',
        description: 'Compare offer to actual damages',
        timeline: 'Within 2 days',
        dependencies: [],
        autoPopulate: true
      },
      {
        step: 2,
        document: 'damage-inventory',
        title: 'Comprehensive Damage Inventory',
        description: 'Detailed inventory of all damages',
        timeline: 'Within 3 days',
        dependencies: ['settlement-comparison'],
        autoPopulate: true
      },
      {
        step: 3,
        document: 'counter-offer-letter',
        title: 'Counter-Offer Letter',
        description: 'Professional counter-offer with evidence',
        timeline: 'Within 5 days',
        dependencies: ['settlement-comparison', 'damage-inventory'],
        autoPopulate: true
      },
      {
        step: 4,
        document: 'appraisal-demand',
        title: 'Appraisal Demand Letter',
        description: 'Request for appraisal if needed',
        timeline: 'Within 7 days',
        dependencies: ['counter-offer-letter'],
        autoPopulate: true
      }
    ],
    'processing-delays': [
      {
        step: 1,
        document: 'delay-complaint',
        title: 'Processing Delay Complaint',
        description: 'Formal complaint about delays',
        timeline: 'Immediately',
        dependencies: [],
        autoPopulate: true
      },
      {
        step: 2,
        document: 'deadline-notice',
        title: 'Deadline Notice',
        description: 'Notice of approaching deadlines',
        timeline: 'Within 2 days',
        dependencies: ['delay-complaint'],
        autoPopulate: true
      },
      {
        step: 3,
        document: 'doi-complaint',
        title: 'DOI Complaint Letter',
        description: 'Complaint to state insurance department',
        timeline: 'Within 5 days',
        dependencies: ['delay-complaint', 'deadline-notice'],
        autoPopulate: true
      },
      {
        step: 4,
        document: 'escalation-notice',
        title: 'Escalation Notice',
        description: 'Notice of intent to escalate',
        timeline: 'Within 7 days',
        dependencies: ['doi-complaint'],
        autoPopulate: true
      }
    ],
    'coverage-dispute': [
      {
        step: 1,
        document: 'coverage-clarification',
        title: 'Coverage Clarification Request',
        description: 'Formal request for clarification',
        timeline: 'Immediately',
        dependencies: [],
        autoPopulate: true
      },
      {
        step: 2,
        document: 'policy-analysis',
        title: 'Policy Coverage Analysis',
        description: 'Detailed analysis of policy language',
        timeline: 'Within 3 days',
        dependencies: ['coverage-clarification'],
        autoPopulate: false
      },
      {
        step: 3,
        document: 'coverage-position',
        title: 'Coverage Position Letter',
        description: 'Formal statement of coverage position',
        timeline: 'Within 5 days',
        dependencies: ['coverage-clarification', 'policy-analysis'],
        autoPopulate: true
      },
      {
        step: 4,
        document: 'legal-opinion',
        title: 'Legal Opinion Request',
        description: 'Request for legal opinion if needed',
        timeline: 'Within 7 days',
        dependencies: ['coverage-position'],
        autoPopulate: false
      }
    ],
    'first-time-filer': [
      {
        step: 1,
        document: 'notice-of-claim',
        title: 'Notice of Claim',
        description: 'Initial claim notification',
        timeline: 'Immediately',
        dependencies: [],
        autoPopulate: true
      },
      {
        step: 2,
        document: 'damage-inventory',
        title: 'Damage Inventory Sheet',
        description: 'Comprehensive inventory of damages',
        timeline: 'Within 2 days',
        dependencies: ['notice-of-claim'],
        autoPopulate: true
      },
      {
        step: 3,
        document: 'claim-timeline',
        title: 'Claim Timeline/Diary',
        description: 'Chronological log of events',
        timeline: 'Ongoing',
        dependencies: ['notice-of-claim'],
        autoPopulate: true
      },
      {
        step: 4,
        document: 'proof-of-loss',
        title: 'Proof of Loss Statement',
        description: 'Sworn statement of damages',
        timeline: 'Within 5 days',
        dependencies: ['damage-inventory', 'claim-timeline'],
        autoPopulate: true
      }
    ]
  };

  const sequence = sequences[situationType] || [
    {
      step: 1,
      document: 'general-claim-letter',
      title: 'General Claim Letter',
      description: 'Professional claim letter template',
      timeline: 'Within 3 days',
      dependencies: [],
      autoPopulate: true
    }
  ];

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      sequence,
      situationType,
      totalSteps: sequence.length,
      estimatedTimeline: calculateEstimatedTimeline(sequence)
    })
  };
}

function prePopulateTemplate(documentType, userResponses, templateData) {
  const prePopulatedData = {
    'appeal-letter': {
      recipient: 'Insurance Company Claims Department',
      subject: 'Appeal of Claim Denial - Policy #' + (userResponses.policyNumber || '[Policy Number]'),
      body: generateAppealLetterBody(userResponses),
      attachments: ['Denial Letter', 'Supporting Documentation', 'Policy Copy'],
      deadline: calculateAppealDeadline(userResponses),
      priority: 'Critical'
    },
    'proof-of-loss': {
      claimNumber: userResponses.claimNumber || '[Claim Number]',
      policyNumber: userResponses.policyNumber || '[Policy Number]',
      lossDate: userResponses.lossDate || '[Loss Date]',
      lossLocation: userResponses.lossLocation || '[Loss Location]',
      damageDescription: generateDamageDescription(userResponses),
      itemizedLosses: generateItemizedLosses(userResponses),
      supportingEvidence: generateSupportingEvidence(userResponses),
      signature: userResponses.fullName || '[Your Name]',
      date: new Date().toLocaleDateString()
    },
    'settlement-comparison': {
      insurerOffer: userResponses.insurerOffer || '[Insurer Offer Amount]',
      actualDamages: calculateActualDamages(userResponses),
      independentEstimates: generateIndependentEstimates(userResponses),
      difference: calculateDifference(userResponses),
      recommendation: generateSettlementRecommendation(userResponses),
      supportingEvidence: generateSettlementEvidence(userResponses)
    },
    'counter-offer-letter': {
      recipient: 'Insurance Company Claims Department',
      subject: 'Counter-Offer to Settlement Proposal - Claim #' + (userResponses.claimNumber || '[Claim Number]'),
      body: generateCounterOfferBody(userResponses),
      counterOfferAmount: calculateCounterOffer(userResponses),
      supportingEvidence: generateCounterOfferEvidence(userResponses),
      deadline: calculateCounterOfferDeadline(userResponses),
      priority: 'High'
    },
    'delay-complaint': {
      recipient: 'Insurance Company Claims Department',
      subject: 'Complaint Regarding Processing Delays - Claim #' + (userResponses.claimNumber || '[Claim Number]'),
      body: generateDelayComplaintBody(userResponses),
      delayTimeline: generateDelayTimeline(userResponses),
      stateRegulations: generateStateRegulations(userResponses),
      violations: generateViolations(userResponses),
      requestedAction: generateRequestedAction(userResponses),
      priority: 'Critical'
    },
    'coverage-clarification': {
      recipient: 'Insurance Company Claims Department',
      subject: 'Request for Coverage Clarification - Claim #' + (userResponses.claimNumber || '[Claim Number]'),
      body: generateCoverageClarificationBody(userResponses),
      coverageQuestions: generateCoverageQuestions(userResponses),
      policyLanguage: generatePolicyLanguage(userResponses),
      supportingEvidence: generateCoverageEvidence(userResponses),
      deadline: calculateCoverageDeadline(userResponses),
      priority: 'High'
    },
    'notice-of-claim': {
      recipient: 'Insurance Company Claims Department',
      subject: 'Notice of Claim - Policy #' + (userResponses.policyNumber || '[Policy Number]'),
      body: generateNoticeOfClaimBody(userResponses),
      lossDate: userResponses.lossDate || '[Loss Date]',
      lossLocation: userResponses.lossLocation || '[Loss Location]',
      lossDescription: userResponses.lossDescription || '[Loss Description]',
      estimatedDamage: userResponses.estimatedDamage || '[Estimated Damage Amount]',
      contactInformation: generateContactInformation(userResponses),
      priority: 'Critical'
    },
    'damage-inventory': {
      claimNumber: userResponses.claimNumber || '[Claim Number]',
      lossDate: userResponses.lossDate || '[Loss Date]',
      lossLocation: userResponses.lossLocation || '[Loss Location]',
      itemizedDamages: generateItemizedDamages(userResponses),
      damagePhotos: generateDamagePhotos(userResponses),
      estimatedValues: generateEstimatedValues(userResponses),
      totalEstimatedValue: calculateTotalEstimatedValue(userResponses),
      signature: userResponses.fullName || '[Your Name]',
      date: new Date().toLocaleDateString()
    }
  };

  const populatedData = prePopulatedData[documentType] || {
    recipient: 'Insurance Company Claims Department',
    subject: 'Claim Related Correspondence',
    body: 'Please find attached the requested documentation.',
    priority: 'Medium'
  };

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      documentType,
      populatedData,
      autoPopulated: true,
      requiredFields: getRequiredFields(documentType),
      optionalFields: getOptionalFields(documentType)
    })
  };
}

function getRelatedDocuments(documentType, situationType) {
  const relatedDocuments = {
    'appeal-letter': ['proof-of-loss', 'policy-analysis', 'demand-letter'],
    'proof-of-loss': ['damage-inventory', 'claim-timeline', 'expense-log'],
    'settlement-comparison': ['counter-offer-letter', 'damage-inventory', 'expert-opinion'],
    'counter-offer-letter': ['settlement-comparison', 'appraisal-demand', 'expert-opinion'],
    'delay-complaint': ['deadline-notice', 'doi-complaint', 'escalation-notice'],
    'coverage-clarification': ['policy-analysis', 'coverage-position', 'legal-opinion'],
    'notice-of-claim': ['damage-inventory', 'claim-timeline', 'proof-of-loss'],
    'damage-inventory': ['proof-of-loss', 'claim-timeline', 'expense-log']
  };

  const related = relatedDocuments[documentType] || [];
  const suggestedSequence = generateSuggestedSequence(documentType, situationType);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      documentType,
      relatedDocuments: related,
      suggestedSequence,
      totalRelated: related.length
    })
  };
}

function validateDocumentData(documentType, templateData) {
  const validationRules = {
    'appeal-letter': {
      required: ['recipient', 'subject', 'body', 'deadline'],
      optional: ['attachments', 'priority', 'cc'],
      maxLength: { body: 5000, subject: 200 }
    },
    'proof-of-loss': {
      required: ['claimNumber', 'policyNumber', 'lossDate', 'damageDescription'],
      optional: ['itemizedLosses', 'supportingEvidence', 'signature'],
      maxLength: { damageDescription: 2000 }
    },
    'settlement-comparison': {
      required: ['insurerOffer', 'actualDamages', 'difference'],
      optional: ['independentEstimates', 'recommendation', 'supportingEvidence'],
      numeric: ['insurerOffer', 'actualDamages', 'difference']
    },
    'counter-offer-letter': {
      required: ['recipient', 'subject', 'body', 'counterOfferAmount'],
      optional: ['supportingEvidence', 'deadline', 'priority'],
      maxLength: { body: 3000, subject: 150 }
    }
  };

  const rules = validationRules[documentType] || {
    required: ['recipient', 'subject', 'body'],
    optional: ['priority'],
    maxLength: { body: 2000, subject: 100 }
  };

  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    missingFields: [],
    invalidFields: []
  };

  // Check required fields
  rules.required.forEach(field => {
    if (!templateData[field] || templateData[field].trim() === '') {
      validation.isValid = false;
      validation.errors.push(`Required field '${field}' is missing`);
      validation.missingFields.push(field);
    }
  });

  // Check field lengths
  if (rules.maxLength) {
    Object.entries(rules.maxLength).forEach(([field, maxLength]) => {
      if (templateData[field] && templateData[field].length > maxLength) {
        validation.isValid = false;
        validation.errors.push(`Field '${field}' exceeds maximum length of ${maxLength} characters`);
        validation.invalidFields.push(field);
      }
    });
  }

  // Check numeric fields
  if (rules.numeric) {
    rules.numeric.forEach(field => {
      if (templateData[field] && isNaN(parseFloat(templateData[field]))) {
        validation.isValid = false;
        validation.errors.push(`Field '${field}' must be a valid number`);
        validation.invalidFields.push(field);
      }
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
      documentType,
      validation,
      rules
    })
  };
}

// Helper functions for generating content
function generateAppealLetterBody(userResponses) {
  return `Dear Claims Department,

I am writing to formally appeal the denial of my claim #${userResponses.claimNumber || '[Claim Number]'} for the loss that occurred on ${userResponses.lossDate || '[Loss Date]'}.

After careful review of your denial letter dated ${userResponses.denialDate || '[Denial Date]'}, I believe this denial was made in error for the following reasons:

1. [Reason 1 based on denial reasons]
2. [Reason 2 based on denial reasons]
3. [Reason 3 based on denial reasons]

I have attached additional supporting documentation that was not previously considered, including:
- [Supporting Document 1]
- [Supporting Document 2]
- [Supporting Document 3]

I respectfully request that you reconsider this decision and approve my claim. I am available to discuss this matter further and can provide any additional information you may require.

Please respond to this appeal within 30 days as required by state law.

Sincerely,
${userResponses.fullName || '[Your Name]'}`;
}

function generateDamageDescription(userResponses) {
  return `The loss occurred on ${userResponses.lossDate || '[Loss Date]'} at ${userResponses.lossLocation || '[Loss Location]'}. The damage was caused by ${userResponses.lossCause || '[Loss Cause]'} and resulted in significant damage to the property and personal belongings.

The damage includes:
- Structural damage to the building
- Damage to personal property
- Additional living expenses
- Other related costs

All damages are documented with photographs, receipts, and professional estimates.`;
}

function generateItemizedLosses(userResponses) {
  return [
    { item: 'Structural Repairs', amount: userResponses.structuralAmount || '[Amount]', description: 'Repair of structural damage' },
    { item: 'Personal Property', amount: userResponses.personalPropertyAmount || '[Amount]', description: 'Replacement of personal belongings' },
    { item: 'Additional Living Expenses', amount: userResponses.aleAmount || '[Amount]', description: 'Temporary housing and related costs' },
    { item: 'Other Expenses', amount: userResponses.otherAmount || '[Amount]', description: 'Additional related costs' }
  ];
}

function generateSupportingEvidence(userResponses) {
  return [
    'Photographs of damage',
    'Professional repair estimates',
    'Receipts for expenses',
    'Police report (if applicable)',
    'Weather reports (if applicable)',
    'Expert opinions (if applicable)'
  ];
}

function calculateAppealDeadline(userResponses) {
  const denialDate = new Date(userResponses.denialDate || new Date());
  const appealDeadline = new Date(denialDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  return appealDeadline.toLocaleDateString();
}

function calculateActualDamages(userResponses) {
  const structural = parseFloat(userResponses.structuralAmount || 0);
  const personal = parseFloat(userResponses.personalPropertyAmount || 0);
  const ale = parseFloat(userResponses.aleAmount || 0);
  const other = parseFloat(userResponses.otherAmount || 0);
  
  return structural + personal + ale + other;
}

function generateIndependentEstimates(userResponses) {
  return [
    { source: 'Contractor Estimate', amount: userResponses.contractorEstimate || '[Amount]', date: userResponses.contractorDate || '[Date]' },
    { source: 'Public Adjuster Estimate', amount: userResponses.adjusterEstimate || '[Amount]', date: userResponses.adjusterDate || '[Date]' },
    { source: 'Independent Appraisal', amount: userResponses.appraisalEstimate || '[Amount]', date: userResponses.appraisalDate || '[Date]' }
  ];
}

function calculateDifference(userResponses) {
  const actual = calculateActualDamages(userResponses);
  const offer = parseFloat(userResponses.insurerOffer || 0);
  return actual - offer;
}

function generateSettlementRecommendation(userResponses) {
  const difference = calculateDifference(userResponses);
  
  if (difference > 0) {
    return `The insurer's offer is ${difference.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} below the actual damages. We recommend rejecting this offer and negotiating for a fair settlement.`;
  } else {
    return 'The insurer's offer appears to be reasonable based on the available estimates.';
  }
}

function generateSettlementEvidence(userResponses) {
  return [
    'Independent repair estimates',
    'Professional damage assessments',
    'Market value comparisons',
    'Expert opinions',
    'Documentation of additional costs'
  ];
}

function generateCounterOfferBody(userResponses) {
  return `Dear Claims Department,

Thank you for your settlement offer of ${userResponses.insurerOffer || '[Offer Amount]'} for claim #${userResponses.claimNumber || '[Claim Number]'}.

After careful analysis of the damages and independent estimates, I must respectfully decline this offer as it does not adequately compensate for the actual losses incurred. Based on my analysis, the fair settlement amount should be ${userResponses.counterOfferAmount || '[Counter Offer Amount]'}.

I have attached supporting documentation including:
- Independent repair estimates
- Professional damage assessments
- Market value comparisons
- Expert opinions

I am willing to negotiate in good faith and believe we can reach a fair settlement. Please respond to this counter-offer within 14 days.

Sincerely,
${userResponses.fullName || '[Your Name]'}`;
}

function calculateCounterOffer(userResponses) {
  const actual = calculateActualDamages(userResponses);
  const offer = parseFloat(userResponses.insurerOffer || 0);
  const difference = actual - offer;
  
  // Counter-offer is typically 80-90% of the difference plus the original offer
  const counterOffer = offer + (difference * 0.85);
  return Math.round(counterOffer);
}

function generateCounterOfferEvidence(userResponses) {
  return [
    'Independent repair estimates',
    'Professional damage assessments',
    'Market value comparisons',
    'Expert opinions',
    'Documentation of additional costs'
  ];
}

function calculateCounterOfferDeadline(userResponses) {
  const today = new Date();
  const deadline = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
  return deadline.toLocaleDateString();
}

function generateDelayComplaintBody(userResponses) {
  return `Dear Claims Department,

I am writing to formally complain about the excessive delays in processing my claim #${userResponses.claimNumber || '[Claim Number]'}.

My claim was filed on ${userResponses.claimFiledDate || '[Claim Filed Date]'} and has been pending for ${userResponses.delayDays || '[Delay Days]'} days, which exceeds the reasonable processing time allowed by state law.

The delays have caused significant hardship, including:
- Additional living expenses
- Delayed repairs
- Increased costs
- Emotional distress

I request immediate action to resolve this claim within 10 business days. If this matter is not resolved promptly, I will be forced to file a complaint with the state insurance department.

Sincerely,
${userResponses.fullName || '[Your Name]'}`;
}

function generateDelayTimeline(userResponses) {
  return [
    { date: userResponses.claimFiledDate || '[Claim Filed Date]', event: 'Claim filed' },
    { date: userResponses.acknowledgmentDate || '[Acknowledgment Date]', event: 'Claim acknowledged' },
    { date: userResponses.inspectionDate || '[Inspection Date]', event: 'Inspection scheduled' },
    { date: userResponses.estimateDate || '[Estimate Date]', event: 'Estimate received' },
    { date: userResponses.currentDate || '[Current Date]', event: 'Still pending' }
  ];
}

function generateStateRegulations(userResponses) {
  return [
    'State law requires claims to be processed within 30 days',
    'Delays beyond 30 days require written explanation',
    'Excessive delays may result in penalties',
    'Policyholders have right to file complaints'
  ];
}

function generateViolations(userResponses) {
  return [
    'Exceeded 30-day processing requirement',
    'Failed to provide written explanation for delays',
    'Inadequate communication about claim status',
    'Violation of good faith requirements'
  ];
}

function generateRequestedAction(userResponses) {
  return [
    'Immediate processing of claim',
    'Written explanation for delays',
    'Regular status updates',
    'Resolution within 10 business days'
  ];
}

function generateCoverageClarificationBody(userResponses) {
  return `Dear Claims Department,

I am writing to request clarification regarding the coverage for my claim #${userResponses.claimNumber || '[Claim Number]'}.

I have questions about the following coverage issues:
1. [Coverage Question 1]
2. [Coverage Question 2]
3. [Coverage Question 3]

I have attached the relevant policy language and supporting documentation. I request a written response clarifying these coverage issues within 10 business days.

Please provide specific policy references and explanations for any coverage determinations.

Sincerely,
${userResponses.fullName || '[Your Name]'}`;
}

function generateCoverageQuestions(userResponses) {
  return [
    'What specific coverage applies to this loss?',
    'Are there any exclusions that might apply?',
    'What are the coverage limits for this type of loss?',
    'What documentation is required to establish coverage?'
  ];
}

function generatePolicyLanguage(userResponses) {
  return [
    'Relevant policy sections',
    'Coverage definitions',
    'Exclusion clauses',
    'Limitation provisions'
  ];
}

function generateCoverageEvidence(userResponses) {
  return [
    'Policy copy',
    'Coverage endorsements',
    'Supporting documentation',
    'Expert opinions'
  ];
}

function calculateCoverageDeadline(userResponses) {
  const today = new Date();
  const deadline = new Date(today.getTime() + (10 * 24 * 60 * 60 * 1000)); // 10 days
  return deadline.toLocaleDateString();
}

function generateNoticeOfClaimBody(userResponses) {
  return `Dear Claims Department,

I am writing to formally notify you of a claim under policy #${userResponses.policyNumber || '[Policy Number]'}.

Claim Details:
- Loss Date: ${userResponses.lossDate || '[Loss Date]'}
- Loss Location: ${userResponses.lossLocation || '[Loss Location]'}
- Loss Description: ${userResponses.lossDescription || '[Loss Description]'}
- Estimated Damage: ${userResponses.estimatedDamage || '[Estimated Damage Amount]'}

I have begun documenting the damage and will provide additional information as it becomes available. Please assign an adjuster to this claim and contact me to schedule an inspection.

I am available to discuss this matter and can provide any additional information you may require.

Sincerely,
${userResponses.fullName || '[Your Name]'}`;
}

function generateContactInformation(userResponses) {
  return {
    name: userResponses.fullName || '[Your Name]',
    phone: userResponses.phone || '[Phone Number]',
    email: userResponses.email || '[Email Address]',
    address: userResponses.address || '[Address]'
  };
}

function generateItemizedDamages(userResponses) {
  return [
    { category: 'Structural Damage', items: ['Roof repairs', 'Wall repairs', 'Floor repairs'], total: userResponses.structuralAmount || '[Amount]' },
    { category: 'Personal Property', items: ['Furniture', 'Electronics', 'Clothing'], total: userResponses.personalPropertyAmount || '[Amount]' },
    { category: 'Additional Living Expenses', items: ['Temporary housing', 'Meals', 'Transportation'], total: userResponses.aleAmount || '[Amount]' }
  ];
}

function generateDamagePhotos(userResponses) {
  return [
    'Exterior damage photos',
    'Interior damage photos',
    'Close-up damage photos',
    'Before and after photos',
    'Video documentation'
  ];
}

function generateEstimatedValues(userResponses) {
  return [
    { item: 'Structural Repairs', estimate: userResponses.structuralEstimate || '[Amount]', source: 'Contractor' },
    { item: 'Personal Property', estimate: userResponses.personalPropertyEstimate || '[Amount]', source: 'Replacement Cost' },
    { item: 'Additional Living Expenses', estimate: userResponses.aleEstimate || '[Amount]', source: 'Actual Costs' }
  ];
}

function calculateTotalEstimatedValue(userResponses) {
  const structural = parseFloat(userResponses.structuralEstimate || 0);
  const personal = parseFloat(userResponses.personalPropertyEstimate || 0);
  const ale = parseFloat(userResponses.aleEstimate || 0);
  
  return structural + personal + ale;
}

function getRequiredFields(documentType) {
  const requiredFields = {
    'appeal-letter': ['recipient', 'subject', 'body', 'deadline'],
    'proof-of-loss': ['claimNumber', 'policyNumber', 'lossDate', 'damageDescription'],
    'settlement-comparison': ['insurerOffer', 'actualDamages', 'difference'],
    'counter-offer-letter': ['recipient', 'subject', 'body', 'counterOfferAmount'],
    'delay-complaint': ['recipient', 'subject', 'body', 'delayTimeline'],
    'coverage-clarification': ['recipient', 'subject', 'body', 'coverageQuestions'],
    'notice-of-claim': ['recipient', 'subject', 'body', 'lossDate', 'lossLocation'],
    'damage-inventory': ['claimNumber', 'lossDate', 'lossLocation', 'itemizedDamages']
  };

  return requiredFields[documentType] || ['recipient', 'subject', 'body'];
}

function getOptionalFields(documentType) {
  const optionalFields = {
    'appeal-letter': ['attachments', 'priority', 'cc'],
    'proof-of-loss': ['itemizedLosses', 'supportingEvidence', 'signature'],
    'settlement-comparison': ['independentEstimates', 'recommendation', 'supportingEvidence'],
    'counter-offer-letter': ['supportingEvidence', 'deadline', 'priority'],
    'delay-complaint': ['stateRegulations', 'violations', 'requestedAction'],
    'coverage-clarification': ['policyLanguage', 'supportingEvidence', 'deadline'],
    'notice-of-claim': ['contactInformation', 'priority'],
    'damage-inventory': ['damagePhotos', 'estimatedValues', 'signature']
  };

  return optionalFields[documentType] || ['priority'];
}

function generateSuggestedSequence(documentType, situationType) {
  const sequences = {
    'appeal-letter': ['proof-of-loss', 'policy-analysis', 'demand-letter'],
    'proof-of-loss': ['damage-inventory', 'claim-timeline', 'expense-log'],
    'settlement-comparison': ['counter-offer-letter', 'appraisal-demand'],
    'counter-offer-letter': ['settlement-comparison', 'appraisal-demand'],
    'delay-complaint': ['deadline-notice', 'doi-complaint'],
    'coverage-clarification': ['policy-analysis', 'coverage-position'],
    'notice-of-claim': ['damage-inventory', 'claim-timeline'],
    'damage-inventory': ['proof-of-loss', 'claim-timeline']
  };

  return sequences[documentType] || [];
}

function calculateEstimatedTimeline(sequence) {
  let totalDays = 0;
  sequence.forEach(step => {
    if (step.timeline.includes('Immediately')) {
      totalDays += 0;
    } else if (step.timeline.includes('Within 1 day')) {
      totalDays += 1;
    } else if (step.timeline.includes('Within 2 days')) {
      totalDays += 2;
    } else if (step.timeline.includes('Within 3 days')) {
      totalDays += 3;
    } else if (step.timeline.includes('Within 5 days')) {
      totalDays += 5;
    } else if (step.timeline.includes('Within 7 days')) {
      totalDays += 7;
    } else if (step.timeline.includes('Within 10 days')) {
      totalDays += 10;
    } else {
      totalDays += 5; // Default
    }
  });
  
  return totalDays;
}

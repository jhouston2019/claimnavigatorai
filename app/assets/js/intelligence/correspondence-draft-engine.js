/**
 * CORRESPONDENCE DRAFT ENGINE
 * Generates editable correspondence drafts for claim communications
 * 
 * CRITICAL CONSTRAINTS:
 * - Drafts only, never auto-send
 * - User must review and confirm
 * - No automatic state mutation
 * - Pure function, deterministic
 */

// ============================================================================
// DRAFT TYPES
// ============================================================================

const DRAFT_TYPE = {
  INITIAL_SUBMISSION: 'INITIAL_SUBMISSION',
  RFI_RESPONSE: 'RFI_RESPONSE',
  SUPPLEMENT_REQUEST: 'SUPPLEMENT_REQUEST',
  DISPUTE_LETTER: 'DISPUTE_LETTER',
  NEGOTIATION_RESPONSE: 'NEGOTIATION_RESPONSE',
  ESCALATION_LETTER: 'ESCALATION_LETTER',
  FOLLOW_UP: 'FOLLOW_UP'
};

// ============================================================================
// DRAFT GENERATION
// ============================================================================

/**
 * Generates correspondence draft
 * @param {Object} params - Draft parameters
 * @returns {Object} Draft correspondence
 */
function generateCorrespondenceDraft(params) {
  const {
    draftType,
    claimInfo,
    carrierInfo,
    estimateAnalysis,
    carrierResponse,
    leverageSignals,
    scopeRegression,
    customPoints = []
  } = params;

  const draft = {
    draftType,
    subject: generateSubject(draftType, claimInfo),
    body: '',
    attachments: [],
    metadata: {
      generatedBy: 'ClaimNavigator',
      generatedAt: new Date().toISOString(),
      requiresUserReview: true,
      requiresUserConfirmation: true,
      executed: false,
      autoSend: false
    },
    disclaimers: [
      'This is a DRAFT only. You must review, edit, and confirm before sending.',
      'Do not send this correspondence without reviewing it for accuracy and completeness.',
      'Consider having a professional review complex or high-value correspondence.'
    ]
  };

  // Generate appropriate draft based on type
  switch (draftType) {
    case DRAFT_TYPE.INITIAL_SUBMISSION:
      draft.body = generateInitialSubmission(claimInfo, estimateAnalysis);
      draft.attachments = suggestSubmissionAttachments(estimateAnalysis);
      break;

    case DRAFT_TYPE.RFI_RESPONSE:
      draft.body = generateRFIResponse(claimInfo, carrierResponse);
      break;

    case DRAFT_TYPE.SUPPLEMENT_REQUEST:
      draft.body = generateSupplementRequest(claimInfo, carrierResponse, leverageSignals, scopeRegression);
      draft.attachments = suggestSupplementAttachments(leverageSignals);
      break;

    case DRAFT_TYPE.DISPUTE_LETTER:
      draft.body = generateDisputeLetter(claimInfo, carrierResponse, leverageSignals);
      break;

    case DRAFT_TYPE.NEGOTIATION_RESPONSE:
      draft.body = generateNegotiationResponse(claimInfo, carrierResponse, leverageSignals);
      break;

    case DRAFT_TYPE.ESCALATION_LETTER:
      draft.body = generateEscalationLetter(claimInfo, carrierResponse);
      break;

    case DRAFT_TYPE.FOLLOW_UP:
      draft.body = generateFollowUp(claimInfo, carrierResponse);
      break;

    default:
      draft.body = generateGenericLetter(claimInfo);
  }

  // Add custom points if provided
  if (customPoints.length > 0) {
    draft.body = insertCustomPoints(draft.body, customPoints);
  }

  return draft;
}

/**
 * Generates subject line
 * @param {string} draftType - Draft type
 * @param {Object} claimInfo - Claim information
 * @returns {string} Subject line
 */
function generateSubject(draftType, claimInfo) {
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const address = claimInfo?.propertyAddress || '[PROPERTY ADDRESS]';

  const subjects = {
    [DRAFT_TYPE.INITIAL_SUBMISSION]: `Claim Submission - ${claimNumber} - ${address}`,
    [DRAFT_TYPE.RFI_RESPONSE]: `Re: Request for Information - ${claimNumber}`,
    [DRAFT_TYPE.SUPPLEMENT_REQUEST]: `Supplemental Claim Request - ${claimNumber}`,
    [DRAFT_TYPE.DISPUTE_LETTER]: `Dispute of Claim Determination - ${claimNumber}`,
    [DRAFT_TYPE.NEGOTIATION_RESPONSE]: `Response to Claim Offer - ${claimNumber}`,
    [DRAFT_TYPE.ESCALATION_LETTER]: `Escalation Request - ${claimNumber}`,
    [DRAFT_TYPE.FOLLOW_UP]: `Follow-Up - ${claimNumber}`
  };

  return subjects[draftType] || `Regarding Claim ${claimNumber}`;
}

/**
 * Generates initial submission letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} estimateAnalysis - Estimate analysis
 * @returns {string} Letter body
 */
function generateInitialSubmission(claimInfo, estimateAnalysis) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const policyNumber = claimInfo?.policyNumber || '[POLICY NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';
  const address = claimInfo?.propertyAddress || '[PROPERTY ADDRESS]';
  const dateOfLoss = claimInfo?.dateOfLoss || '[DATE OF LOSS]';

  let letter = `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Claim Number: ${claimNumber}
    Policy Number: ${policyNumber}
    Insured: ${insuredName}
    Property Address: ${address}
    Date of Loss: ${dateOfLoss}

Dear Claims Adjuster,

I am writing to submit my insurance claim for damages to the above-referenced property. This submission includes a detailed estimate of damages and supporting documentation.

SUMMARY OF DAMAGES:

`;

  // Add estimate summary
  if (estimateAnalysis) {
    letter += `The enclosed estimate documents the following damage:\n\n`;
    
    if (estimateAnalysis.categories) {
      estimateAnalysis.categories.forEach(category => {
        letter += `- ${category.name}: ${category.itemCount} item(s)\n`;
      });
    }

    if (estimateAnalysis.totals) {
      letter += `\nTotal Estimated Damage: $${estimateAnalysis.totals.grandTotal?.toFixed(2) || '[AMOUNT]'}\n`;
    }
  }

  letter += `
ENCLOSED DOCUMENTATION:

Please find the following documentation enclosed with this submission:

1. Detailed estimate of damages
2. Photographs of damaged areas
3. [ADD OTHER DOCUMENTATION AS APPLICABLE]

I have taken care to document all visible damage. Should additional damage be discovered during the repair process, I will submit a supplemental claim as appropriate.

I am available to discuss this claim at your convenience. Please contact me at [YOUR PHONE] or [YOUR EMAIL] with any questions or to schedule an inspection.

I request that you process this claim promptly and provide a written response outlining your determination.

Thank you for your attention to this matter.

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]

Enclosures: As listed above
`;

  return letter;
}

/**
 * Generates RFI response letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} carrierResponse - Carrier response
 * @returns {string} Letter body
 */
function generateRFIResponse(claimInfo, carrierResponse) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  let letter = `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Response to Request for Information
    Claim Number: ${claimNumber}

Dear Claims Adjuster,

I am writing in response to your request for additional information dated [DATE OF RFI].

REQUESTED INFORMATION:

`;

  // Add specific RFI items if available
  if (carrierResponse?.requestedItems) {
    carrierResponse.requestedItems.forEach((item, index) => {
      letter += `${index + 1}. ${item}\n   Response: [PROVIDE YOUR RESPONSE HERE]\n\n`;
    });
  } else {
    letter += `[LIST EACH REQUESTED ITEM AND YOUR RESPONSE]\n\n`;
  }

  letter += `
ENCLOSED DOCUMENTATION:

The following additional documentation is enclosed:

1. [LIST DOCUMENTS]
2. [LIST DOCUMENTS]

Please confirm receipt of this information and advise if you require any additional documentation.

I remain available to discuss this claim at your convenience.

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]

Enclosures: As listed above
`;

  return letter;
}

/**
 * Generates supplement request letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} carrierResponse - Carrier response
 * @param {Object} leverageSignals - Leverage signals
 * @param {Object} scopeRegression - Scope regression
 * @returns {string} Letter body
 */
function generateSupplementRequest(claimInfo, carrierResponse, leverageSignals, scopeRegression) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  let letter = `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Supplemental Claim Request
    Claim Number: ${claimNumber}

Dear Claims Adjuster,

I am writing to request supplemental consideration for items that were not included in your initial claim determination dated [DATE OF CARRIER RESPONSE].

ITEMS REQUIRING SUPPLEMENTAL REVIEW:

`;

  // Add specific omitted items from leverage signals
  if (leverageSignals?.signals) {
    const omittedItems = leverageSignals.signals.filter(s => s.type === 'OMITTED_LINE_ITEMS');
    
    if (omittedItems.length > 0) {
      letter += `The following line items from my original estimate were not addressed in your determination:\n\n`;
      omittedItems.forEach((signal, index) => {
        letter += `${index + 1}. ${signal.description}\n`;
        if (signal.evidence?.amount) {
          letter += `   Estimated Cost: $${signal.evidence.amount.toFixed(2)}\n`;
        }
        letter += `\n`;
      });
    }

    const quantityDiffs = leverageSignals.signals.filter(s => s.type === 'INCONSISTENT_ESTIMATES');
    
    if (quantityDiffs.length > 0) {
      letter += `\nThe following items show quantity differences between estimates:\n\n`;
      quantityDiffs.forEach((signal, index) => {
        letter += `${index + 1}. ${signal.description}\n\n`;
      });
    }
  }

  letter += `
SUPPORTING DOCUMENTATION:

Enclosed please find the following documentation supporting this supplemental request:

1. Photographs of the disputed items
2. [CONTRACTOR QUOTES/OPINIONS]
3. [CODE REQUIREMENTS, IF APPLICABLE]
4. [OTHER SUPPORTING DOCUMENTATION]

REQUESTED ACTION:

I respectfully request that you review these items and provide a supplemental determination. Each item represents documented damage that is covered under my policy.

I am available to discuss these items or to facilitate an additional inspection if needed.

Please provide a written response to this supplemental request within [TIMEFRAME PER STATE LAW/POLICY].

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]

Enclosures: As listed above
`;

  return letter;
}

/**
 * Generates dispute letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} carrierResponse - Carrier response
 * @param {Object} leverageSignals - Leverage signals
 * @returns {string} Letter body
 */
function generateDisputeLetter(claimInfo, carrierResponse, leverageSignals) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  let letter = `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Formal Dispute of Claim Determination
    Claim Number: ${claimNumber}

Dear Claims Manager,

I am writing to formally dispute your claim determination dated [DATE OF CARRIER RESPONSE]. I believe the determination is incomplete and does not adequately address the covered damage to my property.

BASIS FOR DISPUTE:

`;

  // Add specific dispute points
  if (leverageSignals?.signals) {
    letter += `My dispute is based on the following specific issues:\n\n`;
    
    leverageSignals.signals.forEach((signal, index) => {
      letter += `${index + 1}. ${signal.description}\n\n`;
    });
  }

  letter += `
SUPPORTING EVIDENCE:

I have enclosed the following evidence supporting my position:

1. Independent estimate/appraisal
2. Photographs documenting disputed items
3. Contractor opinions
4. [OTHER SUPPORTING EVIDENCE]

REQUESTED RESOLUTION:

I request that you:

1. Review the enclosed evidence
2. Provide a detailed written explanation for any items you continue to exclude or undervalue
3. Revise your determination to reflect the documented damage

NEXT STEPS:

I am willing to participate in a re-inspection or mediation to resolve this dispute. However, if we cannot reach a fair resolution, I am prepared to pursue all available remedies, including:

- Filing a complaint with the [STATE] Department of Insurance
- Engaging legal counsel
- Pursuing appraisal or arbitration as provided in my policy

I prefer to resolve this matter cooperatively and request your prompt attention to this dispute.

Please respond in writing within [TIMEFRAME] days.

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]

Enclosures: As listed above

CC: [STATE] Department of Insurance (for informational purposes)
`;

  return letter;
}

/**
 * Generates negotiation response letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} carrierResponse - Carrier response
 * @param {Object} leverageSignals - Leverage signals
 * @returns {string} Letter body
 */
function generateNegotiationResponse(claimInfo, carrierResponse, leverageSignals) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  let letter = `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Response to Claim Offer
    Claim Number: ${claimNumber}

Dear Claims Adjuster,

Thank you for your claim determination dated [DATE]. I have reviewed your offer and would like to discuss several items before accepting.

ITEMS FOR DISCUSSION:

`;

  if (leverageSignals?.signals) {
    leverageSignals.signals.forEach((signal, index) => {
      letter += `${index + 1}. ${signal.description}\n\n`;
    });
  }

  letter += `
I have enclosed additional documentation addressing these items. I believe these are covered under my policy and should be included in the claim settlement.

I am open to discussing these items and finding a fair resolution. Please contact me at your earliest convenience to discuss.

I look forward to your response.

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]

Enclosures: As listed above
`;

  return letter;
}

/**
 * Generates escalation letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} carrierResponse - Carrier response
 * @returns {string} Letter body
 */
function generateEscalationLetter(claimInfo, carrierResponse) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  let letter = `${date}

[INSURANCE COMPANY NAME] - CLAIMS SUPERVISOR/MANAGER
[INSURANCE COMPANY ADDRESS]

Re: Request for Escalation and Review
    Claim Number: ${claimNumber}

Dear Claims Supervisor,

I am writing to request escalation and supervisory review of my claim. Despite multiple attempts to resolve this matter with the assigned adjuster, we have been unable to reach a fair resolution.

CLAIM HISTORY:

- Date of Loss: [DATE]
- Initial Submission: [DATE]
- Carrier Response: [DATE]
- Supplemental Requests: [DATES]
- Current Status: Unresolved

ISSUES REQUIRING SUPERVISORY REVIEW:

1. [DESCRIBE PRIMARY ISSUE]
2. [DESCRIBE SECONDARY ISSUE]
3. [DESCRIBE ANY PROCEDURAL CONCERNS]

I have made good faith efforts to work with the assigned adjuster, but fundamental disagreements remain regarding coverage and valuation.

REQUESTED ACTION:

I respectfully request that a supervisor or manager review this file and provide an independent assessment. I am willing to participate in a re-inspection, mediation, or other dispute resolution process.

I believe my claim is valid and covered under my policy. I am seeking only fair compensation for the documented damage to my property.

Please contact me within [TIMEFRAME] days to discuss next steps.

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]

CC: [STATE] Department of Insurance
`;

  return letter;
}

/**
 * Generates follow-up letter
 * @param {Object} claimInfo - Claim information
 * @param {Object} carrierResponse - Carrier response
 * @returns {string} Letter body
 */
function generateFollowUp(claimInfo, carrierResponse) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  let letter = `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Follow-Up on Pending Claim
    Claim Number: ${claimNumber}

Dear Claims Adjuster,

I am writing to follow up on my claim, which was submitted on [SUBMISSION DATE]. I have not yet received a response and would appreciate an update on the status.

According to [STATE LAW/POLICY TERMS], claims should be acknowledged within [TIMEFRAME] days. I want to ensure my claim is being processed and has not been overlooked.

Please provide an update on:

1. Current status of my claim
2. Expected timeline for determination
3. Any additional information you may need

I am available to discuss this claim at your convenience. Please contact me at [YOUR PHONE] or [YOUR EMAIL].

Thank you for your prompt attention to this matter.

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]
`;

  return letter;
}

/**
 * Generates generic letter template
 * @param {Object} claimInfo - Claim information
 * @returns {string} Letter body
 */
function generateGenericLetter(claimInfo) {
  const date = new Date().toLocaleDateString();
  const claimNumber = claimInfo?.claimNumber || '[CLAIM NUMBER]';
  const insuredName = claimInfo?.insuredName || '[YOUR NAME]';

  return `${date}

[INSURANCE COMPANY NAME]
[INSURANCE COMPANY ADDRESS]

Re: Claim Number: ${claimNumber}

Dear Claims Adjuster,

[YOUR MESSAGE HERE]

Sincerely,

${insuredName}
[YOUR PHONE]
[YOUR EMAIL]
`;
}

/**
 * Suggests submission attachments
 * @param {Object} estimateAnalysis - Estimate analysis
 * @returns {Array} Suggested attachments
 */
function suggestSubmissionAttachments(estimateAnalysis) {
  return [
    { name: 'Detailed estimate of damages', required: true },
    { name: 'Photographs of all damaged areas', required: true },
    { name: 'Proof of ownership (receipts, if available)', required: false },
    { name: 'Contractor quotes or opinions', required: false },
    { name: 'Police/fire report (if applicable)', required: false }
  ];
}

/**
 * Suggests supplement attachments
 * @param {Object} leverageSignals - Leverage signals
 * @returns {Array} Suggested attachments
 */
function suggestSupplementAttachments(leverageSignals) {
  const attachments = [
    { name: 'Photographs of disputed items', required: true },
    { name: 'Independent contractor quotes', required: true }
  ];

  if (leverageSignals?.signals) {
    const hasCodeIssues = leverageSignals.signals.some(s => 
      s.description.toLowerCase().includes('code')
    );
    
    if (hasCodeIssues) {
      attachments.push({ name: 'Building code requirements', required: true });
    }
  }

  return attachments;
}

/**
 * Inserts custom points into letter
 * @param {string} body - Letter body
 * @param {Array} customPoints - Custom points to insert
 * @returns {string} Modified letter
 */
function insertCustomPoints(body, customPoints) {
  // Insert custom points before the closing
  const closingIndex = body.lastIndexOf('Sincerely,');
  
  if (closingIndex > -1) {
    let customSection = '\n\nADDITIONAL POINTS:\n\n';
    customPoints.forEach((point, index) => {
      customSection += `${index + 1}. ${point}\n\n`;
    });
    
    return body.substring(0, closingIndex) + customSection + body.substring(closingIndex);
  }
  
  return body;
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DRAFT_TYPE,
    generateCorrespondenceDraft,
    generateInitialSubmission,
    generateRFIResponse,
    generateSupplementRequest,
    generateDisputeLetter,
    generateNegotiationResponse,
    generateEscalationLetter,
    generateFollowUp
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.CorrespondenceDraftEngine = {
    DRAFT_TYPE,
    generateCorrespondenceDraft,
    generateInitialSubmission,
    generateRFIResponse,
    generateSupplementRequest,
    generateDisputeLetter,
    generateNegotiationResponse,
    generateEscalationLetter,
    generateFollowUp
  };
}


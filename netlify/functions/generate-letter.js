const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { documentType, formData } = JSON.parse(event.body);

    if (!documentType || !formData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Generate AI prompt based on document type
    const prompt = generatePrompt(documentType, formData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional insurance claims expert and legal document writer. Generate professional, legally-sound documents that are clear, comprehensive, and appropriate for insurance claims. Use proper legal formatting and include all necessary information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        content: generatedContent,
        documentType: documentType,
      }),
    };

  } catch (error) {
    console.error('Error generating document:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate document',
        details: error.message,
      }),
    };
  }
};

function generatePrompt(documentType, formData) {
  const baseInfo = `
Policy Number: ${formData.policyNumber || 'Not provided'}
Claim Number: ${formData.claimNumber || 'Not provided'}
Date of Loss: ${formData.dateOfLoss || 'Not provided'}
Claimant Name: ${formData.claimantName || 'Not provided'}
Claimant Address: ${formData.claimantAddress || 'Not provided'}
Insurance Company: ${formData.insurerName || 'Not provided'}
Phone: ${formData.phoneNumber || 'Not provided'}
Email: ${formData.email || 'Not provided'}
  `;

  switch (documentType) {
    case 'proof-of-loss':
      return `Generate a professional Proof of Loss document with the following information:

${baseInfo}

Additional Details:
- Cause of Loss: ${formData.causeOfLoss || 'Not provided'}
- Location of Loss: ${formData.locationOfLoss || 'Not provided'}
- Total Loss Amount: $${formData.totalLossAmount || 'Not provided'}
- Damage Description: ${formData.damageDescription || 'Not provided'}
- Supporting Documents: ${formData.supportingDocuments || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a comprehensive, legally-sound Proof of Loss that includes all required elements for insurance claims.`;

    case 'appeal-letter':
      return `Generate a professional Appeal Letter with the following information:

${baseInfo}

Additional Details:
- Date of Denial: ${formData.denialDate || 'Not provided'}
- Reason for Denial: ${formData.denialReason || 'Not provided'}
- Policy Language: ${formData.policyLanguage || 'Not provided'}
- Evidence: ${formData.evidence || 'Not provided'}
- Damage Description: ${formData.damageDescription || 'Not provided'}
- Requested Action: ${formData.requestedAction || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a strong, professional appeal letter that challenges the denial with legal arguments and evidence.`;

    case 'demand-letter':
      return `Generate a professional Demand Letter with the following information:

${baseInfo}

Additional Details:
- Demand Amount: $${formData.demandAmount || 'Not provided'}
- Response Deadline: ${formData.responseDeadline || 'Not provided'} days
- Damage Description: ${formData.damageDescription || 'Not provided'}
- Policy Language: ${formData.policyLanguage || 'Not provided'}
- Supporting Evidence: ${formData.supportingEvidence || 'Not provided'}
- Consequences: ${formData.consequences || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a firm but professional demand letter that clearly states the demand and consequences of non-payment.`;

    case 'damage-inventory':
      return `Generate a professional Damage Inventory with the following information:

${baseInfo}

Additional Details:
- Cause of Loss: ${formData.causeOfLoss || 'Not provided'}
- Location of Loss: ${formData.locationOfLoss || 'Not provided'}
- Total Value: $${formData.totalValue || 'Not provided'}
- Damage Items: ${formData.damageItems || 'Not provided'}
- Supporting Documents: ${formData.supportingDocuments || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a comprehensive, line-item inventory of all damages with detailed descriptions and values.`;

    case 'claim-timeline':
      return `Generate a professional Claim Timeline with the following information:

${baseInfo}

Additional Details:
- Cause of Loss: ${formData.causeOfLoss || 'Not provided'}
- Location of Loss: ${formData.locationOfLoss || 'Not provided'}
- Timeline Events: ${formData.timelineEvents || 'Not provided'}
- Communications: ${formData.communications || 'Not provided'}
- Documents Submitted: ${formData.documentsSubmitted || 'Not provided'}
- Current Status: ${formData.currentStatus || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a detailed chronological timeline of all claim events and communications.`;

    case 'repair-replace':
      return `Generate a professional Repair vs Replace Analysis with the following information:

${baseInfo}

Additional Details:
- Item Description: ${formData.itemDescription || 'Not provided'}
- Original Value: $${formData.originalValue || 'Not provided'}
- Repair Cost: ${formData.repairCost || 'Not provided'}
- Replacement Cost: ${formData.replacementCost || 'Not provided'}
- Quality Comparison: ${formData.qualityComparison || 'Not provided'}
- Recommendation: ${formData.recommendation || 'Not provided'}
- Supporting Evidence: ${formData.supportingEvidence || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a comprehensive analysis comparing repair versus replacement options with cost-benefit analysis.`;

    case 'out-of-pocket':
      return `Generate a professional Out-of-Pocket Expense Log with the following information:

${baseInfo}

Additional Details:
- Displacement Start: ${formData.displacementStart || 'Not provided'}
- Displacement End: ${formData.displacementEnd || 'Not provided'}
- Expenses: ${formData.expenses || 'Not provided'}
- Total Amount: $${formData.totalAmount || 'Not provided'}
- Normal Expenses: ${formData.normalExpenses || 'Not provided'}
- Supporting Documents: ${formData.supportingDocuments || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a detailed log of all additional living expenses and out-of-pocket costs.`;

    case 'appraisal-demand':
      return `Generate a professional Appraisal Demand with the following information:

${baseInfo}

Additional Details:
- Insurance Valuation: $${formData.insurerValuation || 'Not provided'}
- Your Valuation: $${formData.yourValuation || 'Not provided'}
- Dispute Details: ${formData.disputeDetails || 'Not provided'}
- Policy Language: ${formData.policyLanguage || 'Not provided'}
- Supporting Evidence: ${formData.supportingEvidence || 'Not provided'}
- Appraiser Selection: ${formData.appraiserSelection || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a formal demand to invoke the appraisal clause in the insurance policy.`;

    case 'notice-of-delay':
      return `Generate a professional Notice of Delay with the following information:

${baseInfo}

Additional Details:
- Claim Report Date: ${formData.claimReportDate || 'Not provided'}
- Expected Resolution: ${formData.expectedResolutionDate || 'Not provided'}
- Delay Details: ${formData.delayDetails || 'Not provided'}
- Communications: ${formData.communications || 'Not provided'}
- Impact: ${formData.impact || 'Not provided'}
- Demand: ${formData.demand || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a formal complaint about delayed claim processing with specific demands for action.`;

    case 'coverage-clarification':
      return `Generate a professional Coverage Clarification Request with the following information:

${baseInfo}

Additional Details:
- Coverage Decision: ${formData.coverageDecision || 'Not provided'}
- Policy Language: ${formData.policyLanguage || 'Not provided'}
- Questions: ${formData.questions || 'Not provided'}
- Supporting Evidence: ${formData.supportingEvidence || 'Not provided'}
- Requested Action: ${formData.requestedAction || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a professional request for clarification on coverage decisions and policy interpretation.`;

    case 'notice-of-claim':
      return `Generate a professional Notice of Claim with the following information:

${baseInfo}

Additional Details:
- Time of Loss: ${formData.timeOfLoss || 'Not provided'}
- Cause of Loss: ${formData.causeOfLoss || 'Not provided'}
- Location of Loss: ${formData.locationOfLoss || 'Not provided'}
- Loss Description: ${formData.lossDescription || 'Not provided'}
- Damage Extent: ${formData.damageExtent || 'Not provided'}
- Immediate Actions: ${formData.immediateActions || 'Not provided'}
- Witnesses: ${formData.witnesses || 'Not provided'}
- Additional Information: ${formData.additionalInfo || 'Not provided'}

Create a comprehensive initial notice of claim with all essential information.`;

    default:
      return `Generate a professional insurance claim document with the following information:

${baseInfo}

Additional Details:
${Object.entries(formData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Create a professional, legally-sound document appropriate for insurance claims.`;
  }
}

const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestData = JSON.parse(event.body || '{}');
    
    // Handle both old format (documentId, title, fields) and new format (topic, formData, documentType)
    let topic, formData, documentType;
    
    if (requestData.topic && requestData.formData) {
      // New topic-based format
      topic = requestData.topic;
      formData = requestData.formData;
      documentType = requestData.documentType || 'Professional Document';
    } else if (requestData.fields && requestData.title) {
      // Old format from Document Generator
      topic = requestData.fields.situationDetails || "General claim assistance needed";
      formData = requestData.fields;
      documentType = requestData.title;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required data. Please provide either topic and formData, or title and fields." })
      };
    }
    
    // Map document type to proper name
    const mappedDocumentType = mapDocumentType(documentType);
    
    // Build the AI prompt
    const prompt = buildAIPrompt(topic, formData, mappedDocumentType);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Claim Navigator, an expert insurance documentation assistant. Generate professional, ready-to-submit insurance claim documents. Use proper formatting with HTML tags for structure. Always include appropriate headers, dates, and signature blocks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const aiContent = completion.choices[0].message.content;
    
    // Apply watermark if claim info is available
    const watermarkedContent = applyWatermark(aiContent, formData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        documentType: mappedDocumentType,
        content: watermarkedContent,
        generatedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error generating document:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate document',
        details: error.message 
      })
    };
  }
};

function mapDocumentType(documentType) {
  const typeMapping = {
    'appeal-letter': 'Appeal Letter',
    'sworn-statement-proof-of-loss': 'Sworn Statement in Proof of Loss',
    'final-demand-payment': 'Final Demand for Payment Letter',
    'personal-property-inventory': 'Personal Property Inventory Claim Form',
    'claim-timeline': 'Claim Timeline / Diary',
    'ale-reimbursement-request': 'ALE Reimbursement Request',
    'claim-expense-tracking': 'Claim Expense Tracking Log',
    'appraisal-demand': 'Appraisal Demand Letter',
    'notice-of-delay': 'Notice of Delay',
    'coverage-clarification': 'Coverage Clarification Request',
    'first-notice-loss': 'First Notice of Loss (FNOL)',
    'bad-faith-complaint': 'Bad Faith Complaint',
    'follow-up-letter': 'Follow-up Letter',
    'business-interruption-claim': 'Business Interruption Claim',
    'settlement-negotiation': 'Settlement Negotiation Letter',
    'fire-damage-claim': 'Fire Damage Claim Documentation',
    'water-damage-claim': 'Water Damage Claim Documentation',
    'flood-damage-claim': 'Flood Damage Claim Documentation',
    'hurricane-windstorm-claim': 'Hurricane/Windstorm Claim Documentation',
    'roof-damage-claim': 'Roof Damage Claim Documentation',
    'mold-claim': 'Mold Claim Documentation',
    'vandalism-theft-claim': 'Vandalism and Theft Claim',
    'attorney-referral': 'Attorney Referral Engagement Letter',
    'expert-engineer-engagement': 'Expert Engineer Engagement Letter',
    'arbitration-demand': 'Arbitration Demand Letter',
    'mediation-request': 'Request for Mediation Letter',
    'doi-complaint': 'Department of Insurance Complaint Letter',
    'notice-intent-litigate': 'Notice of Intent to Litigate Letter',
    'unfair-claims-complaint': 'Complaint for Unfair Claims Practices',
    'commercial-lease-interruption': 'Commercial Lease Interruption Notice',
    'commercial-tenant-damage': 'Commercial Tenant Damage Claim',
    'restaurant-loss-claim': 'Restaurant Loss Claim Documentation',
    'industrial-loss-claim': 'Industrial Loss Claim Documentation',
    'advance-payment-request': 'Request for Advance Payment Letter',
    'withheld-depreciation-release': 'Withheld Depreciation Release Request',
    'settlement-rejection-counteroffer': 'Settlement Rejection and Counteroffer',
    'final-settlement-acceptance': 'Final Settlement Acceptance Letter',
    'claim-evidence-checklist': 'Claim Evidence Checklist',
    'photo-documentation-log': 'Evidence and Photo Documentation Log',
    'communication-tracking': 'Communication Tracking System with Carrier',
    'carrier-contact-log': 'Insurance Carrier Contact Log',
    'line-item-estimate': 'Line Item Estimate Template',
    'professional-estimate': 'Professional Estimate for Restoration',
    'damage-valuation-report': 'Damage Valuation Report',
    'scope-loss-summary': 'Scope of Loss Summary',
    'property-inspection-request': 'Property Inspection Scheduling Request',
    'property-damage-verification': 'Property Damage Verification Statement',
    'residential-construction-contract': 'Residential Construction Contract',
    'temporary-housing-lease': 'Temporary Housing Lease Agreement',
    'authorization-endorse-proceeds': 'Authorization to Endorse Insurance Proceeds',
    'authorization-release-info': 'Authorization for Release of Claim Information',
    'check-endorsement-instructions': 'Check Endorsement Instructions Letter',
    'mortgagee-notification': 'Mortgagee Notification Letter',
    'rebuttal-partial-denial': 'Rebuttal to Carrier Partial Denial of Coverage',
    'rebuttal-wrongful-denial': 'Rebuttal to Wrongful Claim Denial',
    'response-reservation-rights': 'Response to Reservation of Rights Letter',
    'reserve-information-request': 'Reserve Information Request Letter',
    'supplemental-claim-documentation': 'Supplemental Claim Documentation Letter',
    'claim-submission-checklist': 'Property Claim Submission Checklist',
    'claim-summary-report': 'Claim Summary Report',
    'rom-worksheet': 'Rough Order of Magnitude (ROM) Worksheet'
  };
  
  return typeMapping[documentType] || documentType;
}

function applyWatermark(content, claimInfo) {
  if (!claimInfo || Object.keys(claimInfo).length === 0) {
    return content;
  }

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const watermarkHeader = `
<div style="border: 2px solid #1e3a8a; background: #f0f4ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 10px;">
        <strong style="color: #1e3a8a; font-size: 14px;">Claim Navigator - GENERATED DOCUMENT</strong>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #374151;">
        ${claimInfo.name ? `<div><strong>Policyholder:</strong> ${claimInfo.name}</div>` : ''}
        ${claimInfo.policyNumber ? `<div><strong>Policy #:</strong> ${claimInfo.policyNumber}</div>` : ''}
        ${claimInfo.claimNumber ? `<div><strong>Claim #:</strong> ${claimInfo.claimNumber}</div>` : ''}
        ${claimInfo.dateOfLoss ? `<div><strong>Date of Loss:</strong> ${claimInfo.dateOfLoss}</div>` : ''}
        ${claimInfo.insuranceCompany ? `<div><strong>Insurance Co:</strong> ${claimInfo.insuranceCompany}</div>` : ''}
        ${claimInfo.email ? `<div><strong>Email:</strong> ${claimInfo.email}</div>` : ''}
        ${claimInfo.phone ? `<div><strong>Phone:</strong> ${claimInfo.phone}</div>` : ''}
    </div>
    <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #6b7280;">
        Generated on ${today} by Claim Navigator | ${claimInfo.address || ''}
    </div>
</div>
`;

  return watermarkHeader + content;
}

function buildAIPrompt(topic, formData, documentType) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `Generate a professional ${documentType} based on the following information:

CLAIM INFORMATION:
- Policyholder: ${formData.name || 'Not provided'}
- Policy Number: ${formData.policyNumber || 'Not provided'}
- Claim Number: ${formData.claimNumber || 'Not provided'}
- Date of Loss: ${formData.dateOfLoss || 'Not provided'}
- Insurance Company: ${formData.insuranceCompany || 'Not provided'}
- Email: ${formData.email || 'Not provided'}
- Phone: ${formData.phone || 'Not provided'}
- Address: ${formData.address || 'Not provided'}

SITUATION DETAILS:
${topic}

Requirements:
1. Format as a complete, ready-to-submit insurance claim document
2. Include proper letterhead structure with date (${today})
3. Use professional, assertive but polite tone
4. Include all relevant claim details from the information provided
5. Add appropriate legal language and compliance phrasing
6. Include a proper signature block
7. Use HTML formatting with <h2>, <p>, <strong>, and <br> tags for structure
8. Make it specific to the user's situation described in the topic
9. Ensure the document is comprehensive and professional

Generate the complete document now:`;
}

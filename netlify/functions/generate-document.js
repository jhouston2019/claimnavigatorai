import OpenAI from "openai";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const requestData = JSON.parse(event.body || "{}");
    
    // Handle both old format (documentId, title, fields) and new format (topic, formData, documentType)
    let topic, formData, documentType;
    
    if (requestData.topic && requestData.formData) {
      // New topic-based format
      topic = requestData.topic;
      formData = requestData.formData;
      documentType = requestData.documentType || determineDocumentType(topic);
    } else if (requestData.fields && requestData.title) {
      // Old format from Document Generator
      topic = requestData.fields.situationDetails || "General claim assistance needed";
      formData = requestData.fields;
      documentType = requestData.title;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required data. Please provide either topic and formData, or title and fields." }),
      };
    }
    
    // Map document type to proper name
    const mappedDocumentType = mapDocumentType(documentType);
    
    // Build the AI prompt
    const prompt = buildAIPrompt(topic, formData, mappedDocumentType);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are ClaimNavigatorAI, an expert insurance documentation assistant. Generate professional, ready-to-submit insurance claim documents. Use proper formatting with HTML tags for structure. Always include appropriate headers, dates, and signature blocks."
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const aiContent = completion.choices?.[0]?.message?.content || 
      "<p>Unable to generate document at this time. Please try again.</p>";

    // Apply watermark to the generated content
    const watermarkedContent = applyWatermark(aiContent, formData);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        documentType: mappedDocumentType,
        content: watermarkedContent,
        generatedAt: new Date().toISOString()
      }),
    };
  } catch (err) {
    console.error("AI generation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate document",
        details: err.message,
      }),
    };
  }
};

function mapDocumentType(documentType) {
  const typeMapping = {
    // Core Claim Documents
    'sworn-statement-proof-of-loss': 'Sworn Statement in Proof of Loss',
    'appeal-letter': 'Appeal Letter',
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
    
    // Damage-Specific Documents
    'fire-damage-claim': 'Fire Damage Claim Documentation',
    'water-damage-claim': 'Water Damage Claim Documentation',
    'flood-damage-claim': 'Flood Damage Claim Documentation',
    'hurricane-windstorm-claim': 'Hurricane/Windstorm Claim Documentation',
    'roof-damage-claim': 'Roof Damage Claim Documentation',
    'mold-claim': 'Mold Claim Documentation',
    'vandalism-theft-claim': 'Vandalism and Theft Claim',
    
    // Professional Services
    'attorney-referral': 'Attorney Referral Engagement Letter',
    'expert-engineer-engagement': 'Expert Engineer Engagement Letter',
    'arbitration-demand': 'Arbitration Demand Letter',
    'mediation-request': 'Request for Mediation Letter',
    
    // Regulatory & Legal
    'doi-complaint': 'Department of Insurance Complaint Letter',
    'notice-intent-litigate': 'Notice of Intent to Litigate Letter',
    'unfair-claims-complaint': 'Complaint for Unfair Claims Practices',
    
    // Commercial & Business
    'commercial-lease-interruption': 'Commercial Lease Interruption Notice',
    'commercial-tenant-damage': 'Commercial Tenant Damage Claim',
    'restaurant-loss-claim': 'Restaurant Loss Claim Documentation',
    'industrial-loss-claim': 'Industrial Loss Claim Documentation',
    
    // Financial & Settlement
    'advance-payment-request': 'Request for Advance Payment Letter',
    'withheld-depreciation-release': 'Withheld Depreciation Release Request',
    'settlement-rejection-counteroffer': 'Settlement Rejection and Counteroffer',
    'final-settlement-acceptance': 'Final Settlement Acceptance Letter',
    
    // Documentation & Evidence
    'claim-evidence-checklist': 'Claim Evidence Checklist',
    'photo-documentation-log': 'Evidence and Photo Documentation Log',
    'communication-tracking': 'Communication Tracking System with Carrier',
    'carrier-contact-log': 'Insurance Carrier Contact Log',
    
    // Estimates & Valuations
    'line-item-estimate': 'Line Item Estimate Template',
    'professional-estimate': 'Professional Estimate for Restoration',
    'damage-valuation-report': 'Damage Valuation Report',
    'scope-loss-summary': 'Scope of Loss Summary',
    
    // Property & Construction
    'property-inspection-request': 'Property Inspection Scheduling Request',
    'property-damage-verification': 'Property Damage Verification Statement',
    'residential-construction-contract': 'Residential Construction Contract',
    'temporary-housing-lease': 'Temporary Housing Lease Agreement',
    
    // Administrative
    'authorization-endorse-proceeds': 'Authorization to Endorse Insurance Proceeds',
    'authorization-release-info': 'Authorization for Release of Claim Information',
    'check-endorsement-instructions': 'Check Endorsement Instructions Letter',
    'mortgagee-notification': 'Mortgagee Notification Letter',
    
    // Rebuttals & Responses
    'rebuttal-partial-denial': 'Rebuttal to Carrier Partial Denial of Coverage',
    'rebuttal-wrongful-denial': 'Rebuttal to Wrongful Claim Denial',
    'response-reservation-rights': 'Response to Reservation of Rights Letter',
    'reserve-information-request': 'Reserve Information Request Letter',
    
    // Supplemental & Additional
    'supplemental-claim-documentation': 'Supplemental Claim Documentation Letter',
    'claim-submission-checklist': 'Property Claim Submission Checklist',
    'claim-summary-report': 'Claim Summary Report',
    'rom-worksheet': 'Rough Order of Magnitude (ROM) Worksheet'
  };
  
  return typeMapping[documentType] || documentType;
}

function determineDocumentType(topic) {
  const topicLower = topic.toLowerCase();
  
  // Appeal and denial related
  if (topicLower.includes('denied') || topicLower.includes('denial') || 
      topicLower.includes('appeal') || topicLower.includes('underpaid') ||
      topicLower.includes('rejected') || topicLower.includes('refused')) {
    return "Appeal Letter";
  }
  
  // Payment and settlement related
  if (topicLower.includes('payment') || topicLower.includes('settlement') || 
      topicLower.includes('final') || topicLower.includes('demand') ||
      topicLower.includes('compensation') || topicLower.includes('reimbursement')) {
    return "Final Settlement Negotiation Letter";
  }
  
  // Delay and timeline issues
  if (topicLower.includes('delay') || topicLower.includes('no response') || 
      topicLower.includes('timeline') || topicLower.includes('exceeded') ||
      topicLower.includes('slow') || topicLower.includes('waiting')) {
    return "Notice of Delay";
  }
  
  // Proof and documentation
  if (topicLower.includes('proof') || topicLower.includes('sworn') || 
      topicLower.includes('inventory') || topicLower.includes('damage list') ||
      topicLower.includes('documentation') || topicLower.includes('evidence')) {
    return "Proof of Loss";
  }
  
  // Business interruption
  if (topicLower.includes('business') || topicLower.includes('interruption') || 
      topicLower.includes('income') || topicLower.includes('revenue') ||
      topicLower.includes('commercial')) {
    return "Business Interruption Claim Presentation";
  }
  
  // Coverage questions
  if (topicLower.includes('coverage') || topicLower.includes('exclusion') || 
      topicLower.includes('policy') || topicLower.includes('covered') ||
      topicLower.includes('excluded')) {
    return "Coverage Clarification Request";
  }
  
  // Appraisal and valuation
  if (topicLower.includes('appraisal') || topicLower.includes('valuation') || 
      topicLower.includes('dispute') || topicLower.includes('disagreement') ||
      topicLower.includes('value') || topicLower.includes('estimate')) {
    return "Appraisal Demand";
  }
  
  // Initial claim filing
  if (topicLower.includes('new claim') || topicLower.includes('first time') || 
      topicLower.includes('initial') || topicLower.includes('report') ||
      topicLower.includes('file claim')) {
    return "Notice of Claim";
  }
  
  // Bad faith
  if (topicLower.includes('bad faith') || topicLower.includes('unfair') || 
      topicLower.includes('deceptive') || topicLower.includes('malicious') ||
      topicLower.includes('intentional')) {
    return "Bad Faith Letter";
  }
  
  // Follow-up
  if (topicLower.includes('follow up') || topicLower.includes('status') || 
      topicLower.includes('update') || topicLower.includes('check') ||
      topicLower.includes('progress')) {
    return "Follow-up Letter";
  }
  
  // Default to general appeal letter
  return "Appeal Letter";
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
        <strong style="color: #1e3a8a; font-size: 14px;">CLAIM NAVIGATOR AI - GENERATED DOCUMENT</strong>
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
        Generated on ${today} by ClaimNavigatorAI | ${claimInfo.address || ''}
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
  
  const fieldSummary = Object.entries(formData)
    .filter(([key, val]) => val && val.toString().trim() !== '')
    .map(([key, val]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${val}`)
    .join("\n");

  return `You are ClaimNavigatorAI, an insurance documentation assistant.

The user described this claim situation:
"${topic}"

Based on this situation, I need you to generate a professional ${documentType} document.

Use this claim information:
${fieldSummary ? `\nClaim Information:\n${fieldSummary}\n` : ''}

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
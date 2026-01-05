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
    
    // Map document type to proper name and determine format
    const documentInfo = getDocumentInfo(documentType);
    
    // Build the AI prompt based on document type and format
    const prompt = buildAIPrompt(topic, formData, documentInfo);
      
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(documentInfo)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const aiContent = completion.choices[0].message.content;
    
    // Apply watermark if claim info is available
    const watermarkedContent = applyWatermark(aiContent, formData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        documentType: documentInfo.name,
        html: watermarkedContent,
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

function getDocumentInfo(documentType) {
  const documentTypes = {
    // Core Claims
    'claim-form': { name: 'Standard Claim Form', format: 'form', category: 'Core Claims' },
    'proof-of-loss': { name: 'Proof of Loss Documentation', format: 'legal', category: 'Core Claims' },
    'damage-assessment': { name: 'Damage Assessment Report', format: 'report', category: 'Core Claims' },
    'evidence-log': { name: 'Evidence Documentation Log', format: 'log', category: 'Core Claims' },
    'first-notice-of-loss': { name: 'First Notice of Loss', format: 'form', category: 'Core Claims' },
    'claim-sequence-guide': { name: 'Claim Sequence Guide', format: 'guide', category: 'Core Claims' },
    'loss-notice': { name: 'Loss Notice Form', format: 'form', category: 'Core Claims' },
    'claim-summary': { name: 'Claim Summary Report', format: 'report', category: 'Core Claims' },
    
    // Legal Documents
    'demand-letter': { name: 'Payment Demand Letter', format: 'letter', category: 'Legal' },
    'complaint-letter': { name: 'Formal Complaint Letter', format: 'letter', category: 'Legal' },
    'appeal-letter': { name: 'Claim Appeal Letter', format: 'letter', category: 'Legal' },
    'mediation-request': { name: 'Mediation Request Form', format: 'form', category: 'Legal' },
    'settlement-offer': { name: 'Settlement Offer Letter', format: 'letter', category: 'Legal' },
    'arbitration-request': { name: 'Arbitration Request', format: 'form', category: 'Legal' },
    'cease-desist': { name: 'Cease and Desist Letter', format: 'letter', category: 'Legal' },
    'breach-notice': { name: 'Breach of Contract Notice', format: 'letter', category: 'Legal' },
    'bad-faith-letter': { name: 'Bad Faith Insurance Letter', format: 'letter', category: 'Legal' },
    'coverage-opinion': { name: 'Coverage Opinion Request', format: 'form', category: 'Legal' },
    'subrogation-notice': { name: 'Subrogation Notice', format: 'letter', category: 'Legal' },
    'liability-demand': { name: 'Liability Demand Letter', format: 'letter', category: 'Legal' },
    'declaratory-judgment': { name: 'Declaratory Judgment Request', format: 'form', category: 'Legal' },
    'class-action-notice': { name: 'Class Action Notice', format: 'letter', category: 'Legal' },
    'regulatory-filing': { name: 'Regulatory Filing Form', format: 'form', category: 'Legal' },
    
    // Financial Documents
    'payment-demand': { name: 'Payment Demand Letter', format: 'letter', category: 'Financial' },
    'coverage-demand': { name: 'Coverage Demand Letter', format: 'letter', category: 'Financial' },
    'timeline-demand': { name: 'Timeline Demand Letter', format: 'letter', category: 'Financial' },
    'ale-reimbursement-request': { name: 'Additional Living Expenses Request', format: 'form', category: 'Financial' },
    'business-interruption-claim': { name: 'Business Interruption Claim', format: 'report', category: 'Financial' },
    'lost-income-calculation': { name: 'Lost Income Calculation', format: 'spreadsheet', category: 'Financial' },
    'expense-reimbursement': { name: 'Expense Reimbursement Form', format: 'form', category: 'Financial' },
    'depreciation-schedule': { name: 'Depreciation Schedule', format: 'spreadsheet', category: 'Financial' },
    'replacement-cost-analysis': { name: 'Replacement Cost Analysis', format: 'report', category: 'Financial' },
    'contingent-business-interruption': { name: 'Contingent Business Interruption', format: 'report', category: 'Financial' },
    'extra-expense-claim': { name: 'Extra Expense Claim', format: 'form', category: 'Financial' },
    'rental-income-loss': { name: 'Rental Income Loss Claim', format: 'form', category: 'Financial' },
    
    // Forms and Requests
    'document-request': { name: 'Document Request Form', format: 'form', category: 'Forms' },
    'estimate-request': { name: 'Independent Estimate Request', format: 'form', category: 'Forms' },
    'expert-opinion-request': { name: 'Expert Opinion Request', format: 'form', category: 'Forms' },
    'inspection-request': { name: 'Property Inspection Request', format: 'form', category: 'Forms' },
    'medical-records-request': { name: 'Medical Records Request', format: 'form', category: 'Forms' },
    'repair-authorization': { name: 'Repair Authorization Form', format: 'form', category: 'Forms' },
    'witness-statement': { name: 'Witness Statement Form', format: 'form', category: 'Forms' },
    'police-report-request': { name: 'Police Report Request', format: 'form', category: 'Forms' },
    'fire-department-report': { name: 'Fire Department Report Request', format: 'form', category: 'Forms' },
    'weather-service-report': { name: 'Weather Service Report Request', format: 'form', category: 'Forms' },
    'contractor-estimate': { name: 'Contractor Estimate Request', format: 'form', category: 'Forms' },
    'appraisal-request': { name: 'Appraisal Request Form', format: 'form', category: 'Forms' },
    'umpire-selection': { name: 'Umpire Selection Form', format: 'form', category: 'Forms' },
    'examination-under-oath': { name: 'Examination Under Oath Request', format: 'form', category: 'Forms' },
    'recorded-statement': { name: 'Recorded Statement Request', format: 'form', category: 'Forms' },
    'surveillance-notice': { name: 'Surveillance Notice Response', format: 'letter', category: 'Forms' },
    'independent-medical-exam': { name: 'Independent Medical Exam Request', format: 'form', category: 'Forms' },
    'functional-capacity-eval': { name: 'Functional Capacity Evaluation', format: 'form', category: 'Forms' },
    'vocational-assessment': { name: 'Vocational Assessment Request', format: 'form', category: 'Forms' },
    'life-care-plan': { name: 'Life Care Plan Request', format: 'form', category: 'Forms' },
    
    // Appeals and Disputes
    'internal-appeal': { name: 'Internal Appeal Process', format: 'form', category: 'Appeals' },
    'external-appeal': { name: 'External Appeal Documentation', format: 'form', category: 'Appeals' },
    'regulatory-complaint': { name: 'Regulatory Complaint Form', format: 'form', category: 'Appeals' },
    'ombudsman-complaint': { name: 'Ombudsman Complaint', format: 'form', category: 'Appeals' },
    'department-of-insurance': { name: 'Department of Insurance Complaint', format: 'form', category: 'Appeals' },
    'naic-complaint': { name: 'NAIC Complaint Form', format: 'form', category: 'Appeals' },
    'better-business-bureau': { name: 'Better Business Bureau Complaint', format: 'form', category: 'Appeals' },
    'consumer-protection': { name: 'Consumer Protection Complaint', format: 'form', category: 'Appeals' },
    'attorney-general': { name: 'Attorney General Complaint', format: 'form', category: 'Appeals' },
    'federal-trade-commission': { name: 'FTC Complaint Form', format: 'form', category: 'Appeals' },
    
    // Specialty Documents
    'evidence-log-excel': { name: 'Evidence Log Spreadsheet', format: 'spreadsheet', category: 'Specialty' },
    'claim-timeline': { name: 'Claim Timeline Template', format: 'spreadsheet', category: 'Specialty' },
    'correspondence-log': { name: 'Correspondence Log', format: 'log', category: 'Specialty' },
    'phone-call-log': { name: 'Phone Call Log', format: 'log', category: 'Specialty' },
    'email-correspondence': { name: 'Email Correspondence Template', format: 'template', category: 'Specialty' },
    'fax-cover-sheet': { name: 'Fax Cover Sheet', format: 'form', category: 'Specialty' },
    'certified-mail': { name: 'Certified Mail Receipt', format: 'form', category: 'Specialty' },
    'affidavit-template': { name: 'Affidavit Template', format: 'template', category: 'Specialty' },
    'notarization-request': { name: 'Notarization Request Form', format: 'form', category: 'Specialty' },
    'photograph-log': { name: 'Photograph Documentation Log', format: 'log', category: 'Specialty' },
    'video-evidence': { name: 'Video Evidence Log', format: 'log', category: 'Specialty' },
    'receipt-organization': { name: 'Receipt Organization System', format: 'spreadsheet', category: 'Specialty' },
    'inventory-list': { name: 'Property Inventory List', format: 'spreadsheet', category: 'Specialty' },
    'valuation-worksheet': { name: 'Property Valuation Worksheet', format: 'spreadsheet', category: 'Specialty' },
    'depreciation-calculator': { name: 'Depreciation Calculator', format: 'spreadsheet', category: 'Specialty' },
    
    // Property-Specific Documents
    'residential-property': { name: 'Residential Property Claim', format: 'form', category: 'Property' },
    'commercial-property': { name: 'Commercial Property Claim', format: 'form', category: 'Property' },
    'condo-association': { name: 'Condo Association Claim', format: 'form', category: 'Property' },
    'homeowners-association': { name: 'HOA Property Claim', format: 'form', category: 'Property' },
    'rental-property': { name: 'Rental Property Claim', format: 'form', category: 'Property' },
    'vacation-rental': { name: 'Vacation Rental Claim', format: 'form', category: 'Property' },
    'manufactured-home': { name: 'Manufactured Home Claim', format: 'form', category: 'Property' },
    'mobile-home': { name: 'Mobile Home Claim', format: 'form', category: 'Property' },
    'farm-property': { name: 'Farm Property Claim', format: 'form', category: 'Property' },
    'ranch-property': { name: 'Ranch Property Claim', format: 'form', category: 'Property' },
    'vineyard-property': { name: 'Vineyard Property Claim', format: 'form', category: 'Property' },
    'orchard-property': { name: 'Orchard Property Claim', format: 'form', category: 'Property' },
    'greenhouse-property': { name: 'Greenhouse Property Claim', format: 'form', category: 'Property' },
    'aquaculture-property': { name: 'Aquaculture Property Claim', format: 'form', category: 'Property' },
    'timber-property': { name: 'Timber Property Claim', format: 'form', category: 'Property' },
    'mining-property': { name: 'Mining Property Claim', format: 'form', category: 'Property' },
    'oil-gas-property': { name: 'Oil & Gas Property Claim', format: 'form', category: 'Property' },
    'renewable-energy': { name: 'Renewable Energy Property Claim', format: 'form', category: 'Property' },
    'telecommunications': { name: 'Telecommunications Property Claim', format: 'form', category: 'Property' },
    'transportation-property': { name: 'Transportation Property Claim', format: 'form', category: 'Property' },
    
    // Business-Specific Documents
    'restaurant-business': { name: 'Restaurant Business Claim', format: 'form', category: 'Business' },
    'retail-business': { name: 'Retail Business Claim', format: 'form', category: 'Business' },
    'manufacturing-business': { name: 'Manufacturing Business Claim', format: 'form', category: 'Business' },
    'construction-business': { name: 'Construction Business Claim', format: 'form', category: 'Business' },
    'healthcare-business': { name: 'Healthcare Business Claim', format: 'form', category: 'Business' },
    'professional-services': { name: 'Professional Services Claim', format: 'form', category: 'Business' },
    'technology-business': { name: 'Technology Business Claim', format: 'form', category: 'Business' },
    'hospitality-business': { name: 'Hospitality Business Claim', format: 'form', category: 'Business' },
    'education-business': { name: 'Education Business Claim', format: 'form', category: 'Business' },
    'fitness-business': { name: 'Fitness Business Claim', format: 'form', category: 'Business' },
    'beauty-business': { name: 'Beauty Business Claim', format: 'form', category: 'Business' },
    'automotive-business': { name: 'Automotive Business Claim', format: 'form', category: 'Business' },
    'agricultural-business': { name: 'Agricultural Business Claim', format: 'form', category: 'Business' },
    'transportation-business': { name: 'Transportation Business Claim', format: 'form', category: 'Business' },
    'warehouse-business': { name: 'Warehouse Business Claim', format: 'form', category: 'Business' },
    
    // Catastrophic Event Documents
    'hurricane-claim': { name: 'Hurricane Damage Claim', format: 'form', category: 'Catastrophic' },
    'flood-claim': { name: 'Flood Damage Claim', format: 'form', category: 'Catastrophic' },
    'wildfire-claim': { name: 'Wildfire Damage Claim', format: 'form', category: 'Catastrophic' },
    'earthquake-claim': { name: 'Earthquake Damage Claim', format: 'form', category: 'Catastrophic' },
    'tornado-claim': { name: 'Tornado Damage Claim', format: 'form', category: 'Catastrophic' },
    'hail-claim': { name: 'Hail Damage Claim', format: 'form', category: 'Catastrophic' },
    'winter-storm-claim': { name: 'Winter Storm Claim', format: 'form', category: 'Catastrophic' }
  };

  return documentTypes[documentType] || { name: documentType, format: 'document', category: 'General' };
}

function getSystemPrompt(documentInfo) {
  const formatInstructions = {
    'letter': 'Generate a professional business letter with proper letterhead, date, recipient information, body paragraphs, and signature block. Use formal business letter format.',
    'form': 'Generate a structured form with clear sections, fields, and instructions. Include proper form layout with labels and input areas.',
    'report': 'Generate a comprehensive report with executive summary, detailed sections, findings, and recommendations. Use professional report format with headers and subheaders.',
    'spreadsheet': 'Generate a structured table or spreadsheet format with rows, columns, and calculations. Include proper table formatting and formulas where applicable.',
    'log': 'Generate a systematic log with date/time entries, descriptions, and tracking information. Use clear log format with consistent structure.',
    'template': 'Generate a reusable template with placeholders and instructions for completion. Include clear guidance on how to use the template.',
    'guide': 'Generate a step-by-step guide with clear instructions, numbered steps, and helpful tips. Use instructional format with proper organization.',
    'document': 'Generate a professional document with appropriate formatting, structure, and content based on the document type.'
  };

  const basePrompt = "You are Claim Navigator, an expert insurance documentation assistant. Generate professional, ready-to-submit insurance claim documents.";
  const formatPrompt = formatInstructions[documentInfo.format] || formatInstructions['document'];
  
  return `${basePrompt} ${formatPrompt} Use proper HTML formatting with appropriate tags for structure. Always include appropriate headers, dates, and signature blocks when relevant.`;
}

function buildAIPrompt(topic, formData, documentInfo) {
  const today = new Date().toLocaleDateString();
  
  let prompt = `Generate a ${documentInfo.name} for the following situation:\n\n`;
  
  // Add document-specific context
  prompt += `Document Type: ${documentInfo.name}\n`;
  prompt += `Category: ${documentInfo.category}\n`;
  prompt += `Format: ${documentInfo.format}\n\n`;
  
  // Add user information
  if (formData.claimantName) {
    prompt += `Claimant: ${formData.claimantName}\n`;
  }
  if (formData.insurerName) {
    prompt += `Insurance Company: ${formData.insurerName}\n`;
  }
  if (formData.policyNumber) {
    prompt += `Policy Number: ${formData.policyNumber}\n`;
  }
  if (formData.claimNumber) {
    prompt += `Claim Number: ${formData.claimNumber}\n`;
  }
  if (formData.dateOfLoss) {
    prompt += `Date of Loss: ${formData.dateOfLoss}\n`;
  }
  
  prompt += `\nSituation Details: ${topic}\n\n`;
  
  // Add format-specific instructions
  if (documentInfo.format === 'letter') {
    prompt += `Generate a professional business letter with proper formatting, including:\n`;
    prompt += `- Letterhead with date and recipient information\n`;
    prompt += `- Professional salutation and closing\n`;
    prompt += `- Clear, well-structured body paragraphs\n`;
    prompt += `- Appropriate signature block\n\n`;
  } else if (documentInfo.format === 'form') {
    prompt += `Generate a structured form with:\n`;
    prompt += `- Clear section headers\n`;
    prompt += `- Properly labeled fields\n`;
    prompt += `- Instructions for completion\n`;
    prompt += `- Professional formatting\n\n`;
  } else if (documentInfo.format === 'report') {
    prompt += `Generate a comprehensive report with:\n`;
    prompt += `- Executive summary\n`;
    prompt += `- Detailed findings\n`;
    prompt += `- Professional analysis\n`;
    prompt += `- Clear recommendations\n\n`;
  } else if (documentInfo.format === 'spreadsheet') {
    prompt += `Generate a structured table/spreadsheet with:\n`;
    prompt += `- Clear column headers\n`;
    prompt += `- Organized data rows\n`;
    prompt += `- Calculations where appropriate\n`;
    prompt += `- Professional table formatting\n\n`;
  } else if (documentInfo.format === 'log') {
    prompt += `Generate a systematic log with:\n`;
    prompt += `- Date/time entries\n`;
    prompt += `- Clear descriptions\n`;
    prompt += `- Consistent formatting\n`;
    prompt += `- Easy tracking structure\n\n`;
  }
  
  prompt += `Please generate the document using proper HTML formatting with appropriate tags for structure, headers, and content organization.`;
  
  return prompt;
}

function applyWatermark(content, formData) {
  const watermark = `
    <div style="text-align: center; color: #666; font-size: 10px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
      Generated by Claim Navigator - Professional Insurance Claim Documentation
    </div>
  `;
  
  return content + watermark;
}
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Import document metadata
const metadata = require('../../assets/data/document-metadata.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
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
    const { documentType, formData, content } = JSON.parse(event.body || '{}');
    
    if (!documentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Document type is required' }),
      };
    }

    // Find document metadata
    const doc = metadata.find((d) => d.id === documentType);
    
    if (!doc) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Unknown document type' }),
      };
    }

    let generatedContent;

    // Check if this is a template-based document
    if (doc.templateBased && doc.template) {
      generatedContent = await processTemplateDocument(doc, formData, content);
    } else {
      // Use AI generation for non-template documents
      const basePrompt = buildPrompt(doc, formData, content);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are ClaimNavigatorAI, an expert in insurance documentation. Generate professional, legally sound insurance documents with proper formatting based on the document type and metadata provided.'
          },
          {
            role: 'user',
            content: basePrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.6,
      });

      generatedContent = completion.choices[0].message.content;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        documentType: doc.title,
        content: generatedContent,
        metadata: doc
      }),
    };

  } catch (error) {
    console.error('Document generation error:', error);
    
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

function buildPrompt(doc, formData, userContent) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let prompt = `Generate a professional ${doc.title} (${doc.category}) with the following specifications:

DOCUMENT METADATA:
- Type: ${doc.title}
- Category: ${doc.category}
- Format: ${doc.format}
${doc.tone ? `- Tone: ${doc.tone}` : ''}
${doc.sections ? `- Sections: ${doc.sections.join(', ')}` : ''}
${doc.fields ? `- Fields: ${doc.fields.join(', ')}` : ''}
${doc.columns ? `- Columns: ${doc.columns.join(', ')}` : ''}
${doc.items ? `- Checklist Items: ${doc.items.join(', ')}` : ''}

CLAIM INFORMATION:
- Policyholder: ${formData?.name || 'Not provided'}
- Policy Number: ${formData?.policyNumber || 'Not provided'}
- Claim Number: ${formData?.claimNumber || 'Not provided'}
- Date of Loss: ${formData?.dateOfLoss || 'Not provided'}
- Insurance Company: ${formData?.insuranceCompany || 'Not provided'}
- Email: ${formData?.email || 'Not provided'}
- Phone: ${formData?.phone || 'Not provided'}
- Address: ${formData?.address || 'Not provided'}

USER SITUATION:
${userContent || 'General claim assistance needed'}

FORMATTING REQUIREMENTS:
`;

  // Add specific formatting instructions based on document format
  switch (doc.format) {
    case 'narrative':
      prompt += `- Format as a formal letter with proper salutation and closing
- Use paragraph structure with clear sections
- Include professional tone appropriate for ${doc.tone || 'professional'} communication
- Add proper letterhead structure with date (${today})
- Include signature block`;
      break;
      
    case 'fields':
      prompt += `- Format as a structured form with "Field: Value" pairs
- Use clear labels for each field
- Organize information in logical groups
- Include all required fields from the metadata
- Use professional formatting with clear separation`;
      break;
      
    case 'sectioned':
      prompt += `- Format as a structured report with clear section headings
- Use <h2> tags for section headers
- Include all sections from metadata: ${doc.sections?.join(', ')}
- Use bullet points or numbered lists where appropriate
- Maintain professional report formatting`;
      break;
      
    case 'table':
      prompt += `- Format as a table with proper headers
- Use <table>, <tr>, <th>, <td> HTML tags
- Include column headers: ${doc.columns?.join(', ')}
- Add sample data rows to demonstrate format
- Use professional table styling`;
      break;
      
    case 'checklist':
      prompt += `- Format as a bulleted checklist
- Use checkbox symbols (☐) for each item
- Include all items from metadata: ${doc.items?.join(', ')}
- Organize in logical groups
- Use clear, actionable language`;
      break;
      
    case 'contract':
      prompt += `- Format as a formal agreement with numbered clauses
- Use professional contract language
- Include proper legal structure
- Add signature blocks for all parties
- Use formal legal formatting`;
      break;
      
    default:
      prompt += `- Use professional document formatting
- Include appropriate headers and structure
- Maintain consistent formatting throughout`;
  }

  prompt += `

CRITICAL REQUIREMENTS:
1. Generate ONLY the document content - NO CSS styling, NO template instructions, NO placeholder text
2. Include claim information in a professional header format at the top
3. Use clean, professional formatting with proper document structure
4. Make it ready-to-submit and professional
5. Do NOT include any instructional text, CSS, or template placeholders
6. Do NOT include "Instructions for Use" or any template guidance
7. Do NOT include CSS styling or HTML head elements
8. Focus ONLY on the actual document content that would be submitted
9. Replace ALL placeholders with actual information from the claim data provided
10. Generate a complete, professional document ready for immediate submission

Format as clean HTML with proper structure but NO styling, NO instructions, NO placeholders.

Generate the complete document now:`;

  return prompt;
}

async function processTemplateDocument(doc, formData, userContent) {
  try {
    // Read the template file
    const templatePath = path.join(__dirname, '../../assets/templates', doc.template);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Create a mapping of form data to template placeholders
    const placeholderMap = createPlaceholderMap(formData, userContent);
    
    // Replace placeholders in the template
    let processedContent = templateContent;
    
    // Replace standard placeholders (both {{PLACEHOLDER}} and {{Placeholder Name}} formats)
    Object.keys(placeholderMap).forEach(placeholder => {
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      processedContent = processedContent.replace(regex, placeholderMap[placeholder]);
    });
    
    // Handle any remaining empty placeholders
    processedContent = processedContent.replace(/{{[^}]+}}/g, 'Not provided');
    
    // If there's a NARRATIVE_SECTION placeholder, use AI to fill it
    if (processedContent.includes('{{NARRATIVE_SECTION}}')) {
      const narrativeContent = await generateNarrativeSection(doc, formData, userContent);
      processedContent = processedContent.replace('{{NARRATIVE_SECTION}}', narrativeContent);
    }
    
    return processedContent;
    
  } catch (error) {
    console.error('Template processing error:', error);
    throw new Error(`Failed to process template: ${error.message}`);
  }
}

function createPlaceholderMap(formData, userContent) {
  const today = new Date();
  
  return {
    // Basic claim information
    'POLICYHOLDER_NAME': formData.name || 'Not provided',
    'POLICY_NUMBER': formData.policyNumber || 'Not provided',
    'CLAIM_NUMBER': formData.claimNumber || 'Not provided',
    'DATE_OF_LOSS': formData.dateOfLoss || 'Not provided',
    'INSURANCE_COMPANY': formData.insuranceCompany || 'Not provided',
    'ADDRESS': formData.address || 'Not provided',
    'PHONE': formData.phone || 'Not provided',
    'EMAIL': formData.email || 'Not provided',
    
    // Proof of Loss specific fields
    'Insured Name': formData.name || 'Not provided',
    'Mailing Address': formData.address || 'Not provided',
    'Policy Number': formData.policyNumber || 'Not provided',
    'Claim Number': formData.claimNumber || 'Not provided',
    'Date of Loss': formData.dateOfLoss || 'Not provided',
    'Cause of Loss': formData.causeOfLoss || 'Not provided',
    'Description of Damages': formData.damageDescription || userContent || 'Not provided',
    'Total Claimed Amount': formData.totalClaimedAmount || formData.totalClaimAmount || 'Not provided',
    'Adjuster Name': formData.adjusterName || 'Not provided',
    'Insurer Name': formData.insuranceCompany || 'Not provided',
    
    // Current date/time
    'SIGNATURE_DATE': today.toLocaleDateString('en-US'),
    'SWORN_DATE': today.toLocaleDateString('en-US'),
    'WITNESS_DATE': today.toLocaleDateString('en-US'),
    'CONTRACT_DATE': today.toLocaleDateString('en-US'),
    'LEASE_DATE': today.toLocaleDateString('en-US'),
    
    // Additional fields that might be in form data
    'TIME_OF_LOSS': formData.timeOfLoss || 'Not specified',
    'CAUSE_OF_LOSS': formData.causeOfLoss || 'Not specified',
    'LOCATION_OF_LOSS': formData.locationOfLoss || formData.address || 'Not specified',
    'TOTAL_CLAIM_AMOUNT': formData.totalClaimAmount || 'Not specified',
    'DAMAGE_DESCRIPTION': formData.damageDescription || userContent || 'Not specified',
    'DAMAGED_PROPERTY_LIST': formData.damagedPropertyList || 'Not specified',
    'PERSONAL_PROPERTY_AMOUNT': formData.personalPropertyAmount || 'Not specified',
    'STRUCTURAL_DAMAGE_AMOUNT': formData.structuralDamageAmount || 'Not specified',
    'ALE_AMOUNT': formData.aleAmount || 'Not specified',
    'OTHER_DOCUMENTATION': formData.otherDocumentation || 'None',
    
    // State/County information
    'STATE': formData.state || 'Not specified',
    'COUNTY': formData.county || 'Not specified',
    
    // Authorization specific
    'AUTHORIZED_PARTIES': formData.authorizedParties || 'Insurance company and representatives',
    'AUTHORIZATION_DURATION': formData.authorizationDuration || 'one year',
    'OTHER_INFORMATION': formData.otherInformation || 'None',
    
    // Contract specific
    'CONTRACTOR_NAME': formData.contractorName || 'Not specified',
    'CONTRACTOR_LICENSE': formData.contractorLicense || 'Not specified',
    'CONTRACTOR_ADDRESS': formData.contractorAddress || 'Not specified',
    'CONTRACTOR_PHONE': formData.contractorPhone || 'Not specified',
    'CONTRACTOR_EMAIL': formData.contractorEmail || 'Not specified',
    'SCOPE_OF_WORK': formData.scopeOfWork || 'Not specified',
    'DETAILED_SCOPE_OF_WORK': formData.detailedScopeOfWork || formData.scopeOfWork || 'Not specified',
    'TOTAL_CONTRACT_AMOUNT': formData.totalContractAmount || 'Not specified',
    'PAYMENT_SCHEDULE': formData.paymentSchedule || 'As work progresses',
    'START_DATE': formData.startDate || 'To be determined',
    'COMPLETION_DATE': formData.completionDate || 'To be determined',
    'WARRANTY_PERIOD': formData.warrantyPeriod || 'One year',
    'LIABILITY_INSURANCE_AMOUNT': formData.liabilityInsuranceAmount || 'Not specified',
    'TERMINATION_NOTICE': formData.terminationNotice || '30 days',
    'DISPUTE_RESOLUTION_METHOD': formData.disputeResolutionMethod || 'Arbitration',
    'GOVERNING_STATE': formData.governingState || formData.state || 'Not specified',
    
    // Lease specific
    'LANDLORD_NAME': formData.landlordName || 'Not specified',
    'LANDLORD_ADDRESS': formData.landlordAddress || 'Not specified',
    'LANDLORD_PHONE': formData.landlordPhone || 'Not specified',
    'LANDLORD_EMAIL': formData.landlordEmail || 'Not specified',
    'RENTAL_PROPERTY_ADDRESS': formData.rentalPropertyAddress || 'Not specified',
    'PROPERTY_TYPE': formData.propertyType || 'Residential',
    'BEDROOMS': formData.bedrooms || 'Not specified',
    'BATHROOMS': formData.bathrooms || 'Not specified',
    'MONTHLY_RENT': formData.monthlyRent || 'Not specified',
    'SECURITY_DEPOSIT': formData.securityDeposit || 'Not specified',
    'FIRST_RENT_DUE_DATE': formData.firstRentDueDate || 'Not specified',
    'RENT_DUE_DAY': formData.rentDueDay || '1st',
    'LATE_FEE': formData.lateFee || 'Not specified',
    'LATE_FEE_DATE': formData.lateFeeDate || '5th',
    'TENANT_UTILITIES': formData.tenantUtilities || 'Electricity, gas, water, trash',
    'LANDLORD_UTILITIES': formData.landlordUtilities || 'None',
    'LEASE_START_DATE': formData.leaseStartDate || 'Not specified',
    'LEASE_END_DATE': formData.leaseEndDate || 'Not specified',
    'LEASE_DURATION': formData.leaseDuration || 'Not specified',
    'TENANT_MAINTENANCE': formData.tenantMaintenance || 'Basic cleaning and minor repairs',
    'LANDLORD_MAINTENANCE': formData.landlordMaintenance || 'Major repairs and structural issues',
    'PETS_ALLOWED': formData.petsAllowed || 'No',
    'PET_DEPOSIT': formData.petDeposit || 'Not applicable',
    
    // Witness information
    'WITNESS_NAME': formData.witnessName || 'Not specified',
    'NOTARY_EXPIRATION': formData.notaryExpiration || 'Not specified',
    
    // Other parties
    'OTHER_PARTIES': formData.otherParties || 'None',
    'BANK_NAME': formData.bankName || 'Not specified',
    'ACCOUNT_NUMBER': formData.accountNumber || 'Not specified',
    'ROUTING_NUMBER': formData.routingNumber || 'Not specified',
    
    // Contract numbers
    'CONTRACT_NUMBER': formData.contractNumber || `CON-${Date.now()}`,
    'LEASE_NUMBER': formData.leaseNumber || `LEASE-${Date.now()}`,
    
    // Signature dates
    'OWNER_SIGNATURE_DATE': today.toLocaleDateString('en-US'),
    'CONTRACTOR_SIGNATURE_DATE': today.toLocaleDateString('en-US'),
    'LANDLORD_SIGNATURE_DATE': today.toLocaleDateString('en-US'),
    'TENANT_SIGNATURE_DATE': today.toLocaleDateString('en-US')
  };
}

async function generateNarrativeSection(doc, formData, userContent) {
  try {
    const narrativePrompt = `Generate a brief narrative section for a ${doc.title} based on the following information:

CLAIM INFORMATION:
- Policyholder: ${formData.name || 'Not provided'}
- Policy Number: ${formData.policyNumber || 'Not provided'}
- Claim Number: ${formData.claimNumber || 'Not provided'}
- Date of Loss: ${formData.dateOfLoss || 'Not provided'}
- Insurance Company: ${formData.insuranceCompany || 'Not provided'}

USER SITUATION:
${userContent || 'General claim assistance needed'}

Generate a brief, professional narrative section that explains the specific circumstances of this claim. Keep it concise and factual. Do not include any legal disclaimers or instructions.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are ClaimNavigatorAI. Generate brief, professional narrative sections for insurance documents. Be concise and factual.'
        },
        {
          role: 'user',
          content: narrativePrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.6,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Narrative generation error:', error);
    return 'Narrative section to be completed by the policyholder.';
  }
}
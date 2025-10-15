const OpenAI = require('openai');

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { docId, formData, userData } = JSON.parse(event.body);
    
    if (!docId || !formData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing docId or formData' })
      };
    }

    // Create a comprehensive prompt for the specific document type
    const prompt = createDocumentPrompt(docId, formData, userData);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert legal document generator specializing in insurance claims. Generate professional, legally sound documents that protect policyholder rights. Use proper legal formatting and include all necessary sections."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const generatedContent = response.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        output: generatedContent,
        docId: docId,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Document generation error:', error);
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

function createDocumentPrompt(docId, formData, userData = {}) {
  const documentTemplates = {
    'proof-of-loss': `
      Generate a comprehensive, legally sound Proof of Loss document for insurance claim submission.
      
      USER INFORMATION:
      Policyholder: ${userData.userName || 'Not provided'}
      Policy Number: ${userData.policyNumber || formData.field_1 || 'Not provided'}
      Claim Number: ${userData.claimNumber || formData.field_2 || 'Not provided'}
      Date of Loss: ${userData.dateOfLoss || formData.field_3 || 'Not provided'}
      Property Address: ${userData.propertyAddress || formData.field_4 || 'Not provided'}
      
      LOSS DETAILS:
      Claimant Information: ${formData.field_0 || userData.userName || 'Not provided'}
      Loss Description: ${formData.field_5 || 'Not provided'}
      Estimated Loss Amount: $${formData.field_6 || '0'}
      
      Create a professional Proof of Loss document that includes:
      1. Formal legal header with all policy and claim information
      2. Sworn statement of loss with detailed description
      3. Itemized list of all damaged property with replacement costs
      4. Supporting documentation requirements and deadlines
      5. Legal language appropriate for insurance claims
      6. Professional formatting suitable for legal submission
      7. Signature lines and notarization requirements
      
      Format as a formal legal document with proper structure and professional language.
    `,
    
    'demand-letter': `
      Generate a professional, legally sound Payment Demand Letter for insurance claim disputes.
      
      USER INFORMATION:
      Policyholder: ${userData.userName || 'Not provided'}
      Policy Number: ${userData.policyNumber || 'Not provided'}
      Claim Number: ${userData.claimNumber || formData.field_1 || 'Not provided'}
      Property Address: ${userData.propertyAddress || 'Not provided'}
      
      DEMAND DETAILS:
      Insurer: ${formData.field_0 || 'Not provided'}
      Disputed Amount: $${formData.field_2 || '0'}
      Reason for Demand: ${formData.field_3 || 'Not provided'}
      Response Deadline: ${formData.field_4 || 'Not provided'}
      
      Create a formal demand letter that includes:
      1. Professional letterhead with policyholder information
      2. Clear statement of the payment demand
      3. Legal basis and supporting arguments
      4. Specific deadline for response
      5. Consequences of non-compliance
      6. Professional but firm tone
      7. Proper legal formatting and structure
      
      Format as a formal business letter with professional language and legal precision.
    `,
    
    'appeal-letter': `
      Generate a professional Claim Denial Appeal Letter based on the following information:
      
      Insurer: ${formData.field_0 || 'Not provided'}
      Claim Number: ${formData.field_1 || 'Not provided'}
      Denial Reason: ${formData.field_2 || 'Not provided'}
      Your Arguments: ${formData.field_3 || 'Not provided'}
      Supporting Evidence: ${formData.field_4 || 'Not provided'}
      
      Create an appeal letter that includes:
      1. Professional letterhead and formatting
      2. Clear statement of the appeal
      3. Point-by-point rebuttal of denial reasons
      4. Legal arguments supporting your position
      5. Reference to supporting evidence
      6. Request for reconsideration with specific timeline
    `,
    
    'damage-assessment': `
      Generate a comprehensive Damage Assessment Report based on the following information:
      
      Property Address: ${formData.field_0 || 'Not provided'}
      Assessment Date: ${formData.field_1 || 'Not provided'}
      Assessor Name: ${formData.field_2 || 'Not provided'}
      Damage Description: ${formData.field_3 || 'Not provided'}
      Repair Costs: ${formData.field_4 || 'Not provided'}
      
      Create a professional damage assessment that includes:
      1. Executive summary of findings
      2. Detailed damage description
      3. Itemized repair costs
      4. Supporting photographs and documentation
      5. Professional assessor credentials
      6. Recommendations for repair or replacement
    `,
    
    'business-interruption-claim': `
      Generate a comprehensive Business Interruption Claim based on the following information:
      
      Business Name: ${formData.field_0 || 'Not provided'}
      Business Address: ${formData.field_1 || 'Not provided'}
      Interruption Start: ${formData.field_2 || 'Not provided'}
      Interruption End: ${formData.field_3 || 'Not provided'}
      Lost Revenue: $${formData.field_4 || '0'}
      Additional Expenses: $${formData.field_5 || '0'}
      
      Create a business interruption claim that includes:
      1. Business information and policy details
      2. Detailed timeline of interruption
      3. Financial impact analysis
      4. Supporting financial documentation
      5. Calculation of lost profits
      6. Professional formatting for insurance submission
    `
  };

  // Default template for unknown document types
  const defaultTemplate = `
    Generate a professional ${docId.replace(/-/g, ' ')} document based on the following information:
    
    Form Data: ${JSON.stringify(formData, null, 2)}
    
    Create a comprehensive, professional document that includes:
    1. Proper legal formatting and structure
    2. All necessary sections and information
    3. Professional language appropriate for insurance claims
    4. Clear organization and readability
    5. Legal compliance and accuracy
  `;

  return documentTemplates[docId] || defaultTemplate;
}

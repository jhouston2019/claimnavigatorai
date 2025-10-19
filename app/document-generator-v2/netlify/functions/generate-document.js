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
    const { docId, formData, userData, useAI } = JSON.parse(event.body);
    
    if (!docId || !formData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing docId or formData' })
      };
    }

    // Create a comprehensive prompt for the specific document type
    const prompt = createDocumentPrompt(docId, formData, userData, useAI);
    
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
      body: JSON.stringify({ error: 'Failed to generate document' })
    };
  }
};

function createDocumentPrompt(docId, formData, userData = {}, useAI = false) {
  const documentTemplates = {
    'proof-of-loss': `
      Generate a professional Proof of Loss Documentation for an insurance claim.
      
      User Information:
      - Name: ${userData.userName || formData.userName || '[Name]'}
      - Policy: ${userData.policyNumber || formData.policyNumber || '[Policy Number]'}
      - Claim: ${userData.claimNumber || formData.claimNumber || '[Claim Number]'}
      - Date of Loss: ${formData.dateOfLoss || '[Date of Loss]'}
      - Property: ${formData.propertyAddress || '[Property Address]'}
      
      Form Data: ${JSON.stringify(formData, null, 2)}
      
      ${useAI ? 'Create a personalized, AI-enhanced proof of loss that addresses the specific circumstances and maximizes the claim value.' : 'Create a comprehensive, standardized proof of loss document.'}
      
      Include:
      1. Professional header with claim information
      2. Detailed loss description
      3. Itemized damage list with values
      4. Supporting documentation requirements
      5. Legal compliance statements
      6. Signature section with date
    `,
    
    'demand-letter': `
      Generate a professional Settlement Demand Letter for an insurance claim.
      
      User Information:
      - Name: ${userData.userName || formData.userName || '[Name]'}
      - Policy: ${userData.policyNumber || formData.policyNumber || '[Policy Number]'}
      - Claim: ${userData.claimNumber || formData.claimNumber || '[Claim Number]'}
      - Date of Loss: ${formData.dateOfLoss || '[Date of Loss]'}
      - Property: ${formData.propertyAddress || '[Property Address]'}
      
      Form Data: ${JSON.stringify(formData, null, 2)}
      
      ${useAI ? 'Create a personalized, AI-enhanced demand letter that maximizes settlement potential and addresses specific claim circumstances.' : 'Create a comprehensive, standardized demand letter.'}
      
      Include:
      1. Professional business letter format
      2. Clear demand amount and justification
      3. Legal basis for the claim
      4. Supporting evidence summary
      5. Response deadline
      6. Professional closing
    `,
    
    'appeal-letter': `
      Generate a professional Claim Denial Appeal Letter.
      
      User Information:
      - Name: ${userData.userName || formData.userName || '[Name]'}
      - Policy: ${userData.policyNumber || formData.policyNumber || '[Policy Number]'}
      - Claim: ${userData.claimNumber || formData.claimNumber || '[Claim Number]'}
      - Date of Loss: ${formData.dateOfLoss || '[Date of Loss]'}
      - Property: ${formData.propertyAddress || '[Property Address]'}
      
      Form Data: ${JSON.stringify(formData, null, 2)}
      
      ${useAI ? 'Create a personalized, AI-enhanced appeal letter that effectively challenges the denial and maximizes chances of reversal.' : 'Create a comprehensive, standardized appeal letter.'}
      
      Include:
      1. Professional business letter format
      2. Point-by-point rebuttal of denial reasons
      3. Legal arguments supporting the claim
      4. Supporting evidence and documentation
      5. Request for specific action
      6. Professional closing
    `
  };

  // Default template for unknown document types
  const defaultTemplate = `
    Generate a professional ${docId.replace(/-/g, ' ')} document based on the following information:
    
    User Information:
    - Name: ${userData.userName || formData.userName || '[Name]'}
    - Policy: ${userData.policyNumber || formData.policyNumber || '[Policy Number]'}
    - Claim: ${userData.claimNumber || formData.claimNumber || '[Claim Number]'}
    
    Form Data: ${JSON.stringify(formData, null, 2)}
    
    ${useAI ? 'Create a personalized, AI-enhanced document that addresses the specific circumstances and maximizes the claim value.' : 'Create a comprehensive, professional document.'}
    
    Create a comprehensive, professional document that includes:
    1. Proper legal formatting and structure
    2. All necessary sections and information
    3. Professional language appropriate for insurance claims
    4. Clear organization and readability
    5. Legal compliance and accuracy
  `;

  return documentTemplates[docId] || defaultTemplate;
}
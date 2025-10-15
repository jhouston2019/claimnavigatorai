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
    const { docId, formData } = JSON.parse(event.body);
    
    if (!docId || !formData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing docId or formData' })
      };
    }

    // Create a comprehensive prompt for the specific document type
    const prompt = createDocumentPrompt(docId, formData);
    
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

function createDocumentPrompt(docId, formData) {
  const documentTemplates = {
    'proof-of-loss': `
      Generate a comprehensive Proof of Loss document based on the following information:
      
      Claimant Information: ${formData.field_0 || 'Not provided'}
      Policy Number: ${formData.field_1 || 'Not provided'}
      Claim Number: ${formData.field_2 || 'Not provided'}
      Loss Date: ${formData.field_3 || 'Not provided'}
      Loss Location: ${formData.field_4 || 'Not provided'}
      Description of Loss: ${formData.field_5 || 'Not provided'}
      Estimated Loss Amount: $${formData.field_6 || '0'}
      
      Create a professional Proof of Loss document that includes:
      1. Proper legal header with claimant and policy information
      2. Detailed description of the loss event
      3. Itemized list of damaged property with values
      4. Supporting documentation requirements
      5. Legal language appropriate for insurance claims
      6. Professional formatting suitable for legal submission
    `,
    
    'demand-letter': `
      Generate a professional Payment Demand Letter based on the following information:
      
      Insurer: ${formData.field_0 || 'Not provided'}
      Claim Number: ${formData.field_1 || 'Not provided'}
      Disputed Amount: $${formData.field_2 || '0'}
      Reason for Demand: ${formData.field_3 || 'Not provided'}
      Response Deadline: ${formData.field_4 || 'Not provided'}
      
      Create a formal demand letter that includes:
      1. Professional letterhead and formatting
      2. Clear statement of the demand
      3. Legal basis for the demand
      4. Specific deadline for response
      5. Consequences of non-compliance
      6. Professional but firm tone
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

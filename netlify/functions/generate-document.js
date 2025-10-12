import { json, readBody, openaiChat } from './_utils.js';

export default async (req) => {
  try {
    const { documentType, claimData } = await readBody(req);
    
    if (!documentType || !claimData) {
      return json(400, { error: 'Document type and claim data are required' });
    }

    // Create a comprehensive prompt for AI document generation
    const systemPrompt = `You are Claim Navigator AI, an expert insurance claim advisor and document generator. You specialize in creating professional, legally sound insurance claim documents that maximize policyholder rights and claim value.

Your task is to generate a comprehensive, professional document based on the specific document type and claim situation provided. The document should be:

1. PROFESSIONAL: Use formal business letter format with proper structure
2. LEGALLY SOUND: Include relevant legal references and policy language
3. SPECIFIC: Tailored to the exact situation and document type
4. ACTIONABLE: Provide clear next steps and demands
5. COMPREHENSIVE: Include all necessary details and supporting information

Document Structure:
- Professional letterhead format
- Clear subject line and reference numbers
- Detailed situation analysis
- Specific legal and policy references
- Clear demands and next steps
- Professional closing with contact information

Focus on protecting the policyholder's rights and maximizing claim value.`;

    const userPrompt = `Generate a professional ${documentType.replace(/-/g, ' ')} document for the following claim situation:

CLAIM INFORMATION
================
Policyholder: ${claimData.claimantName}
Address: ${claimData.claimantAddress}
Phone: ${claimData.phoneNumber || 'Not provided'}
Email: ${claimData.email || 'Not provided'}

Policy Number: ${claimData.policyNumber}
Claim Number: ${claimData.claimNumber}
Date of Loss: ${claimData.dateOfLoss}
Insurance Company: ${claimData.insurerName}

Generated: ${new Date().toLocaleDateString()}
Document Type: ${documentType.replace(/-/g, ' ').toUpperCase()}

========================================

SITUATION DESCRIPTION:
${claimData.situationDetails}

DOCUMENT TYPE: ${documentType}

Please generate a comprehensive, professional document that:
1. STARTS with the claim information header shown above
2. Uses the claimant's actual information (no placeholders)
3. Addresses the specific situation described
4. Includes relevant legal references and policy language
5. Provides clear, actionable next steps
6. Is professionally formatted and ready to send
7. Maximizes the policyholder's rights and claim value

Make the document specific, detailed, and immediately actionable.`;

    const { content } = await openaiChat(systemPrompt, userPrompt);

    return json(200, {
      content: content,
      documentType: documentType,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Document Generation Error:', error);
    
    return json(500, {
      error: 'Failed to generate document',
      details: error.message
    });
  }
};
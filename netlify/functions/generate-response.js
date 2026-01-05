const { json, readBody, openaiChat } = require('./utils-helper.js');

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const text = body.inputText || '';
  const lang = body.language || 'en';
  
  // Extract claim information from body if available
  const claimInfo = {
    claimantName: body.claimantName || 'Not provided',
    policyNumber: body.policyNumber || 'Not provided',
    claimNumber: body.claimNumber || 'Not provided',
    dateOfLoss: body.dateOfLoss || 'Not provided',
    insurerName: body.insurerName || 'Not provided',
    phoneNumber: body.phoneNumber || 'Not provided',
    email: body.email || 'Not provided',
    claimantAddress: body.claimantAddress || 'Not provided'
  };
  
  // Generate claim header
  const claimHeader = `CLAIM INFORMATION
================
Policyholder: ${claimInfo.claimantName}
Address: ${claimInfo.claimantAddress}
Phone: ${claimInfo.phoneNumber}
Email: ${claimInfo.email}

Policy Number: ${claimInfo.policyNumber}
Claim Number: ${claimInfo.claimNumber}
Date of Loss: ${claimInfo.dateOfLoss}
Insurance Company: ${claimInfo.insurerName}

Generated: ${new Date().toLocaleDateString()}
Document Type: AI RESPONSE

========================================

`;
  
  const sys = "You are Claim Navigator. Draft clear, assertive claim communications. Keep output HTML-ready. ALWAYS start your response with the claim information header provided.";
  const { content } = await openaiChat([{role:'system',content:sys},{role:'user',content:`Language: ${lang}\n\nClaim Information Header:\n${claimHeader}\n\nTask:\n${text}`}]);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true, data: { response: content }, error: null })
  };
};
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
    const { docId } = event.queryStringParameters;
    
    if (!docId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing docId parameter' })
      };
    }

    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `${docId.replace(/-/g, ' ').toUpperCase()}`,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
          }),
          new Paragraph({
            text: '',
          }),
          new Paragraph({
            text: 'Document Information:',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Document Type: ${docId}`,
          }),
          new Paragraph({
            text: `This is a DOCX export of the ${docId} document.`,
          }),
          new Paragraph({
            text: 'This document was generated using ClaimNavigatorAI Document Generator.',
          }),
          new Paragraph({
            text: '',
          }),
          new Paragraph({
            text: 'ClaimNavigatorAI - Professional Insurance Claim Tools',
            children: [
              new TextRun({
                text: 'ClaimNavigatorAI - Professional Insurance Claim Tools',
                size: 20,
              }),
            ],
          }),
        ],
      }],
    });

    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    const base64DOCX = buffer.toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${docId}.docx"`
      },
      body: base64DOCX,
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('DOCX export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate DOCX',
        details: error.message 
      })
    };
  }
};

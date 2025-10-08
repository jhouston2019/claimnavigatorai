const { createClient } = require('@supabase/supabase-js');
const { addClaimantProtection, logDocumentAccess } = require('./utils/pdf-protection');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const { document_slug, user_id } = event.queryStringParameters || {};
    
    if (!document_slug || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: document_slug and user_id' })
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get user's claim information
    const { data: claimData, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (claimError || !claimData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Claim information not found' })
      };
    }

    // Get document metadata
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('slug', document_slug)
      .single();

    if (docError || !documentData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Document not found' })
      };
    }

    // Fetch the original PDF from Supabase storage
    const { data: pdfData, error: storageError } = await supabase.storage
      .from('documents')
      .download(documentData.template_path);

    if (storageError || !pdfData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Document file not found' })
      };
    }

    // Convert blob to buffer
    const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());

    // Prepare claimant information
    const claimantInfo = {
      user_id: user_id,
      insured_name: claimData.insured_name,
      policy_number: claimData.policy_number,
      insurer: claimData.insurer,
      date_of_loss: claimData.date_of_loss,
      loss_location: claimData.loss_location,
      property_type: claimData.property_type,
      status: claimData.status
    };

    // Add claimant protection to the PDF
    const { protectedPdf, documentId } = await addClaimantProtection(pdfBuffer, claimantInfo);

    // Log document access
    await logDocumentAccess(documentId, claimantInfo, 'download');

    // Return the protected PDF
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${documentData.label}_protected.pdf"`,
        'Content-Length': protectedPdf.length.toString(),
        'X-Document-ID': documentId,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: protectedPdf.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error in protected document download:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

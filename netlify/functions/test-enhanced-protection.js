const { createClient } = require('@supabase/supabase-js');
const { addClaimantProtection, generateDocumentId } = require('./utils/pdf-protection');

exports.handler = async (event, context) => {
  try {
    console.log('Testing enhanced document protection');
    
    // Test parameters
    const { user_id, document_path } = event.queryStringParameters || {};
    
    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id parameter is required for testing" })
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
        body: JSON.stringify({ 
          error: "Claim information not found for user",
          user_id: user_id,
          claimError: claimError?.message
        })
      };
    }

    // Test document path (use a default if not provided)
    const testDocumentPath = document_path || 'en/Proof of Loss - Property.pdf';
    const localUrl = `https://claimnavigatorai.com/docs/${testDocumentPath}`;
    
    console.log('Testing with document:', localUrl);
    
    // Fetch the protected document
    const response = await fetch(localUrl);
    
    if (!response.ok) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: "Test document not found",
          url: localUrl,
          status: response.status
        })
      };
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    console.log('Test PDF fetched successfully, size:', pdfBuffer.length);

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

    // Test adding claimant protection
    const { protectedPdf, documentId } = await addClaimantProtection(pdfBuffer, claimantInfo);
    
    console.log('Protection added successfully, document ID:', documentId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Enhanced protection test successful',
        documentId: documentId,
        claimantInfo: {
          insured_name: claimantInfo.insured_name,
          policy_number: claimantInfo.policy_number,
          insurer: claimantInfo.insurer,
          date_of_loss: claimantInfo.date_of_loss,
          property_type: claimantInfo.property_type,
          status: claimantInfo.status
        },
        originalSize: pdfBuffer.length,
        protectedSize: protectedPdf.length,
        testDocument: testDocumentPath
      })
    };

  } catch (error) {
    console.error('Error in enhanced protection test:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Test failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
};

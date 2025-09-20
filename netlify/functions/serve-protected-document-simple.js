const { createClient } = require('@supabase/supabase-js');
const { addClaimantProtection, generateDocumentId, logDocumentAccess } = require('./utils/pdf-protection');

exports.handler = async (event) => {
  try {
    console.log('Enhanced protected document function called');
    
    // Get document path and user ID from query parameters
    const { documentPath, user_id } = event.queryStringParameters || {};
    
    if (!documentPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Document path is required" })
      };
    }

    // Get user email from JWT token or use default
    let userEmail = 'user@claimnavigatorai.com';
    let userId = user_id;
    
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload && payload.email) {
            userEmail = payload.email;
          }
          if (payload && payload.sub) {
            userId = payload.sub;
          }
        }
      } catch (jwtError) {
        console.log("Could not decode JWT, using default values");
      }
    }
    
    console.log("Serving document for user:", userEmail, "ID:", userId);

    // Fetch the protected document directly
    const decodedPath = decodeURIComponent(documentPath);
    const localUrl = `https://claimnavigatorai.netlify.app/docs/${decodedPath}`;
    console.log('Fetching from:', localUrl);
    
    const response = await fetch(localUrl);
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: "Document not found",
          url: localUrl,
          status: response.status
        })
      };
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    console.log('PDF fetched successfully, size:', pdfBuffer.length);

    // If we have a user ID, try to get claimant information and add protection
    let finalPdfBuffer = pdfBuffer;
    let documentId = null;
    
    if (userId) {
      try {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );

        // Get user's claim information
        const { data: claimData, error: claimError } = await supabase
          .from('claims')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (claimData && !claimError) {
          console.log('Found claim data for user:', userId);
          
          // Prepare claimant information
          const claimantInfo = {
            user_id: userId,
            insured_name: claimData.insured_name,
            policy_number: claimData.policy_number,
            insurer: claimData.insurer,
            date_of_loss: claimData.date_of_loss,
            loss_location: claimData.loss_location,
            property_type: claimData.property_type,
            status: claimData.status
          };

          // Add claimant protection to the already-protected PDF
          const { protectedPdf, documentId: docId } = await addClaimantProtection(pdfBuffer, claimantInfo);
          finalPdfBuffer = protectedPdf;
          documentId = docId;
          
          // Log document access
          await logDocumentAccess(docId, claimantInfo, 'download');
          
          console.log('Added claimant protection to document, ID:', docId);
        } else {
          console.log('No claim data found for user:', userId, claimError?.message);
          // Generate a basic document ID even without claim data
          documentId = generateDocumentId(userId, 'unknown', Date.now());
        }
      } catch (protectionError) {
        console.error('Error adding claimant protection:', protectionError);
        // Continue with original PDF if protection fails
        documentId = generateDocumentId(userId || 'anonymous', 'unknown', Date.now());
      }
    } else {
      console.log('No user ID provided, serving original protected document');
    }

    // Log the document access for tracking
    console.log(`Document accessed: ${decodedPath} by user: ${userEmail} (ID: ${userId})`);

    const headers = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="protected-${decodedPath.split('/').pop()}"`,
      'Content-Length': finalPdfBuffer.length,
      'Cache-Control': 'no-cache',
      'X-User-Email': userEmail,
      'X-Document-Path': decodedPath,
      'X-Access-Time': new Date().toISOString(),
      'X-Protection-Applied': 'password-watermark-claimant-protection'
    };

    // Add document ID to headers if available
    if (documentId) {
      headers['X-Document-ID'] = documentId;
    }

    return {
      statusCode: 200,
      headers: headers,
      body: finalPdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Error in enhanced protected document function:", err);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || "Failed to serve document",
        stack: err.stack
      })
    };
  }
};
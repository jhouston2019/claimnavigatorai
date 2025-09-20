const { createClient } = require('@supabase/supabase-js');
const { addClaimantProtection, generateDocumentId, logDocumentAccess } = require('./utils/pdf-protection');
const { requireClaimAccess, logClaimAccess } = require('./utils/claim-access-control');

exports.handler = async (event) => {
  try {
    console.log('Enhanced protected document function called');
    
    // Get document path and claim ID from query parameters
    const { documentPath, claim_id } = event.queryStringParameters || {};
    
    if (!documentPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Document path is required" })
      };
    }

    if (!claim_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Claim ID is required" })
      };
    }

    // Validate claim access
    const accessResult = await requireClaimAccess(event, claim_id);
    if (accessResult.statusCode) {
      return accessResult; // Return error response
    }

    const { userId, claim, claimantInfo } = accessResult;

    // Get user email from JWT token
    let userEmail = 'user@claimnavigatorai.com';
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
        }
      } catch (jwtError) {
        console.log("Could not decode JWT, using default email");
      }
    }
    
    console.log("Serving document for user:", userEmail, "ID:", userId, "Claim:", claim_id);

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

    // Add claimant protection using the validated claim information
    let finalPdfBuffer = pdfBuffer;
    let documentId = null;
    
    try {
      // Add claimant protection to the already-protected PDF
      const { protectedPdf, documentId: docId } = await addClaimantProtection(pdfBuffer, claimantInfo);
      finalPdfBuffer = protectedPdf;
      documentId = docId;
      
      // Log claim access
      await logClaimAccess(
        userId, 
        claim_id, 
        decodedPath, 
        'downloaded', 
        'template',
        {
          document_path: decodedPath,
          file_size: finalPdfBuffer.length,
          user_email: userEmail
        }
      );
      
      console.log('Added claimant protection to document, ID:', docId);
    } catch (protectionError) {
      console.error('Error adding claimant protection:', protectionError);
      // Continue with original PDF if protection fails
      documentId = generateDocumentId(userId, claimantInfo.policy_number, Date.now());
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
      'X-Protection-Applied': 'password-watermark-claimant-protection',
      'X-Claim-ID': claim_id
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
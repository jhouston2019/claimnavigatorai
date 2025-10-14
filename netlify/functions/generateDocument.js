const { createClient } = require('@supabase/supabase-js');
const { validateDocumentInput } = require('../../lib/validation/schemas');
const { generateDocument } = require('../../lib/ai/generate');
const { htmlToPDFBuffer } = require('../../lib/files/pdf');
const { htmlToDocxBuffer, parseHtmlToSections } = require('../../lib/files/docx');
const { checkDocumentLimit } = require('../../lib/stripe/subscription');
const { uploadFile, getSignedUrl } = require('../../lib/supabase/storage');
const { insertDocument } = require('../../lib/supabase/documents');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { docType, lang, input } = JSON.parse(event.body);

    if (!docType || !lang || !input) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: docType, lang, input' })
      };
    }

    // Validate language
    if (!['en', 'es'].includes(lang)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid language. Must be "en" or "es"' })
      };
    }

    // Get user from auth header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    console.log(`Document generation request from user: ${user.email}, type: ${docType}, lang: ${lang}`);

    // Check document limits
    const limitCheck = await checkDocumentLimit({ 
      userId: user.id, 
      email: user.email, 
      supabase 
    });

    if (!limitCheck.canGenerate) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ 
          error: 'Document limit reached',
          upgradeRequired: limitCheck.subscriptionStatus === 'none',
          count: limitCheck.count,
          limit: limitCheck.limit
        })
      };
    }

    // Validate input data
    let validatedInput;
    try {
      validatedInput = validateDocumentInput(docType, input);
    } catch (validationError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationError.errors || validationError.message 
        })
      };
    }

    // Generate document content using OpenAI
    const { content: htmlContent } = await generateDocument({
      docType,
      lang,
      input: validatedInput
    });

    if (!htmlContent) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to generate document content' })
      };
    }

    // Create sanitized HTML excerpt for preview
    const htmlExcerpt = htmlContent.substring(0, 500) + (htmlContent.length > 500 ? '...' : '');

    // Generate timestamp for file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userId = user.id;

    // Generate PDF
    const pdfBuffer = await htmlToPDFBuffer(htmlContent, {
      policyholderName: validatedInput.policyholderName,
      docType: docType
    });

    // Generate DOCX
    const sections = parseHtmlToSections(htmlContent);
    const docxBuffer = await htmlToDocxBuffer({
      title: docType.replace('-', ' ').toUpperCase(),
      sections,
      policyholderName: validatedInput.policyholderName,
      docType: docType
    });

    // Upload files to Supabase storage
    const pdfPath = `generated-docs/${userId}/${docType}/${timestamp}.pdf`;
    const docxPath = `generated-docs/${userId}/${docType}/${timestamp}.docx`;

    const [pdfUpload, docxUpload] = await Promise.all([
      uploadFile({
        buffer: pdfBuffer,
        path: pdfPath,
        contentType: 'application/pdf'
      }),
      uploadFile({
        buffer: docxBuffer,
        path: docxPath,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    ]);

    // Insert document record
    const documentRecord = await insertDocument({
      userId: user.id,
      docType,
      lang,
      inputJson: validatedInput,
      htmlExcerpt,
      pdfPath: pdfUpload.path,
      docxPath: docxUpload.path
    });

    // Generate signed URLs for downloads (24 hour expiry)
    const [pdfUrl, docxUrl] = await Promise.all([
      getSignedUrl({ path: pdfUpload.path, expiresIn: 86400 }),
      getSignedUrl({ path: docxUpload.path, expiresIn: 86400 })
    ]);

    console.log(`Document generated successfully: ${documentRecord.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        html: htmlContent,
        pdfUrl,
        docxUrl,
        docId: documentRecord.id,
        message: 'Document generated successfully'
      })
    };

  } catch (error) {
    console.error('Document generation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

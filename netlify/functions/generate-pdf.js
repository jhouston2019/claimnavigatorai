/**
 * PDF Generation Function
 * Generates PDFs from document content
 */

const { PDFDocument, rgb } = require('pdf-lib');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/pdf'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/plain' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Parse request
    const body = JSON.parse(event.body || '{}');
    const { document_content, metadata = {} } = body;

    if (!document_content) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'document_content required' })
      };
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const { width, height } = page.getSize();
    
    // Add title if provided
    let yPosition = height - 50;
    if (metadata.title) {
      page.drawText(metadata.title, {
        x: 50,
        y: yPosition,
        size: 16,
        color: rgb(0, 0, 0)
      });
      yPosition -= 30;
    }

    // Add subject if provided
    if (metadata.subject) {
      page.drawText(`Subject: ${metadata.subject}`, {
        x: 50,
        y: yPosition,
        size: 12,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 20;
    }

    // Add content (simple text wrapping)
    const lines = wrapText(document_content, width - 100, 10);
    let currentY = yPosition;
    
    for (const line of lines) {
      if (currentY < 50) {
        // New page
        const newPage = pdfDoc.addPage([612, 792]);
        currentY = height - 50;
        page = newPage;
      }
      
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: 10,
        color: rgb(0, 0, 0)
      });
      
      currentY -= 12;
    }

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Optionally save to storage
    if (metadata.save_to_storage) {
      const fileName = `${user.id}/${Date.now()}-${metadata.title || 'document'}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: pdfBytes.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Simple text wrapping
 */
function wrapText(text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    // Approximate width (rough estimate)
    const testWidth = testLine.length * (fontSize * 0.6);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}




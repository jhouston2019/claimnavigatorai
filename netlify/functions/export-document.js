const { getBlob } = require("@netlify/blobs");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun } = require("docx");

exports.handler = async (event, context) => {
  // Verify Netlify Identity authentication
  if (!context.clientContext?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
    };
  }

  try {
    const { content, format, filename = "claim-response" } = JSON.parse(event.body);
    
    if (!content || !format) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Content and format are required" })
      };
    }

    let fileBuffer;
    let contentType;
    let fileExtension;

    if (format.toLowerCase() === 'pdf') {
      // Generate PDF using PDFKit
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Add title
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('Claim Response Document', { align: 'center' })
         .moveDown(0.5);
      
      // Add timestamp
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' })
         .moveDown(1);
      
      // Add content
      doc.fontSize(12)
         .font('Helvetica')
         .text(content, { align: 'justify' });

      doc.end();
      
      fileBuffer = Buffer.concat(chunks);
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else if (format.toLowerCase() === 'docx') {
      // Generate DOCX using docx package
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Claim Response Document',
                  bold: true,
                  size: 32
                })
              ],
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString()}`,
                  size: 20
                })
              ],
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: content,
                  size: 24
                })
              ],
              spacing: { after: 200 }
            })
          ]
        }]
      });

      fileBuffer = await Packer.toBuffer(doc);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unsupported format. Use 'pdf' or 'docx'" })
      };
    }

    // Store the generated document in Netlify Blobs
    const blobStore = getBlob('responses');
    const documentId = `${context.clientContext.user.sub}-${Date.now()}`;
    await blobStore.set(documentId, fileBuffer, {
      metadata: {
        userId: context.clientContext.user.sub,
        format: format,
        filename: filename,
        createdAt: new Date().toISOString()
      }
    });

    // Return the file for download
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Content-Length': fileBuffer.length.toString()
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Export document error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to export document" })
    };
  }
};

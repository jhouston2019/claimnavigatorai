const PDFDocument = require('pdfkit');
const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { fileName, content } = JSON.parse(event.body);

    if (!fileName || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fileName or content" }) };
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      // This will be handled by the promise resolution
    });

    // Add content to PDF
    doc.fontSize(12);
    doc.text(content, 50, 50, { width: 500 });

    // Finalize the PDF
    doc.end();

    // Wait for PDF to be generated
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("Document generation error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate document." }) };
  }
};

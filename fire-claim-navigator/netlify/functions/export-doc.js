const { Document, Packer, Paragraph } = require("docx");
const { generateSecurePDF } = require('./utils/pdf-security');
const { getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event); // validate session and get user
    const { type, content } = JSON.parse(event.body);

    if (type === "docx") {
      const doc = new Document({
        sections: [{ children: [new Paragraph(content)] }]
      });
      const buffer = await Packer.toBuffer(doc);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        body: buffer.toString("base64"),
        isBase64Encoded: true
      };
    }

    if (type === "pdf") {
      // Generate secure PDF with password protection and watermarking
      const pdfBuffer = await generateSecurePDF(content, user.email, 'Claim Document');
      
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/pdf" },
        body: pdfBuffer.toString("base64"),
        isBase64Encoded: true
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Invalid type" }) };
  } catch (err) {
    console.error("export-doc error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

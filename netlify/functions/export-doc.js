const { Document, Packer, Paragraph } = require("docx");
const PDFDocument = require("pdfkit");
const stream = require("stream");

exports.handler = async (event) => {
  try {
    const { type, content } = JSON.parse(event.body);

    if (type === "docx") {
      const doc = new Document({
        sections: [{ properties: {}, children: [new Paragraph(content)] }]
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
      const doc = new PDFDocument();
      const passthrough = new stream.PassThrough();
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {});
      doc.text(content);
      doc.end();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/pdf" },
        body: Buffer.concat(chunks).toString("base64"),
        isBase64Encoded: true
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Invalid type" }) };
  } catch (err) {
    console.error("export-doc error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

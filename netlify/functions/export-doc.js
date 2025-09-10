const { Document, Packer, Paragraph } = require("docx");
const PDFDocument = require("pdfkit");
const stream = require("stream");

exports.handler = async (event) => {
  try {
    const { email, type = "docx", content = "No content provided" } = JSON.parse(event.body);

    if (!email || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email or content" }) };
    }

    if (type === "docx") {
      const doc = new Document({
        sections: [{ properties: {}, children: [new Paragraph(content)] }],
      });

      const buffer = await Packer.toBuffer(doc);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        body: buffer.toString("base64"),
        isBase64Encoded: true,
      };
    }

    if (type === "pdf") {
      const pdfBuffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const bufs = [];
        doc.on("data", bufs.push.bind(bufs));
        doc.on("end", () => resolve(Buffer.concat(bufs)));
        doc.text(content);
        doc.end();
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/pdf" },
        body: pdfBuffer.toString("base64"),
        isBase64Encoded: true,
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unsupported type" }) };
  } catch (err) {
    console.error("export-doc error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

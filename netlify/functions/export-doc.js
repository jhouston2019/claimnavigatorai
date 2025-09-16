const { Document, Packer, Paragraph } = require("docx");
const PDFDocument = require("pdfkit");
const { getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    await getUserFromAuth(event); // validate session
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
      const doc = new PDFDocument();
      let chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.text(content);
      doc.end();

      await new Promise((resolve) => doc.on("end", resolve));

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

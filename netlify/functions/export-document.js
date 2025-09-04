const { Document, Packer, Paragraph, TextRun } = require("docx");
const PDFDocument = require("pdfkit");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { text, format, filename } = JSON.parse(event.body || "{}");
    if (!text || !format) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields: text, format" }) };
    }

    const safeName = (filename || "ClaimNavigatorAI-Document").replace(/[^a-zA-Z0-9-_\.]/g, "_");

    if (format.toLowerCase() === "docx") {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: text.split(/\n\n+/).map((block) =>
              new Paragraph({
                children: block.split("\n").map((line, index) =>
                  new TextRun({ text: line + (index < block.split("\n").length - 1 ? "\n" : ""), size: 24 })
                ),
                spacing: { after: 200 },
              })
            ),
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeName}.docx"`,
        },
        isBase64Encoded: true,
        body: buffer.toString("base64"),
      };
    }

    if (format.toLowerCase() === "pdf") {
      const doc = new PDFDocument({ size: "LETTER", margin: 50 });
      doc.fontSize(12);

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      return await new Promise((resolve) => {
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            statusCode: 200,
            headers: {
              ...headers,
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
            },
            isBase64Encoded: true,
            body: buffer.toString("base64"),
          });
        });

        const paragraphs = text.split(/\n\n+/);
        paragraphs.forEach((para, idx) => {
          doc.text(para, { align: "left" });
          if (idx < paragraphs.length - 1) {
            doc.moveDown(1);
          }
        });

        doc.end();
      });
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unsupported format. Use 'pdf' or 'docx'" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to export document", message: err.message }) };
  }
};


const { createClient } = require('@supabase/supabase-js');
const { Document, Packer, Paragraph } = require("docx");
const PDFDocument = require("pdfkit");
const stream = require("stream");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    // 1. Verify JWT
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token." }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session." }) };
    }

    // 2. Parse request body
    const { type, content } = JSON.parse(event.body);
    if (!type || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing type or content." }) };
    }

    // 3. Handle DOCX
    if (type === "docx") {
      const doc = new Document({
        sections: [{ properties: {}, children: [new Paragraph(content)] }]
      });
      const buffer = await Packer.toBuffer(doc);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": "attachment; filename=AI-Response.docx"
        },
        body: buffer.toString("base64"),
        isBase64Encoded: true
      };
    }

    // 4. Handle PDF
    if (type === "pdf") {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {});

      doc.text(content);
      doc.end();

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=AI-Response.pdf"
        },
        body: Buffer.concat(chunks).toString("base64"),
        isBase64Encoded: true
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Invalid type." }) };

  } catch (err) {
    console.error("export-doc error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

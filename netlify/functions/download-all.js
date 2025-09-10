const { createClient } = require('@supabase/supabase-js');
const archiver = require("archiver");
const streamBuffers = require("stream-buffers");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Missing email" }) };

    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, content, created_at')
      .eq('email', email);

    if (error) throw error;

    const outputBuffer = new streamBuffers.WritableStreamBuffer();
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(outputBuffer);

    docs.forEach((doc, i) => {
      archive.append(doc.content, { name: `draft-${i + 1}.txt` });
    });

    await archive.finalize();

    const zipBuffer = outputBuffer.getContents();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/zip" },
      body: zipBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("download-all error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

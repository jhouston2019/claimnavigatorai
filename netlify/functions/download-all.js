const archiver = require("archiver");
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Missing email" }) };

    const { data: drafts } = await supabase.from("drafts").select("content").eq("email", email);

    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    drafts.forEach((d, i) => {
      archive.append(d.content, { name: `draft-${i + 1}.txt` });
    });
    await archive.finalize();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/zip" },
      body: Buffer.concat(chunks).toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("download-all error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

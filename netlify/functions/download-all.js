const archiver = require("archiver");
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 1. Verify JWT
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token" }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session" }) };
    }

    // 2. Fetch drafts owned by this user
    const { data: drafts, error: draftsError } = await supabase
      .from("drafts")
      .select("content")
      .eq("email", user.email);

    if (draftsError) throw draftsError;

    if (!drafts || drafts.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "No drafts found." }) };
    }

    // 3. Build ZIP archive in memory
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks = [];
    archive.on("data", (chunk) => chunks.push(chunk));

    drafts.forEach((d, i) => {
      archive.append(d.content || "", { name: `draft-${i + 1}.txt` });
    });

    await archive.finalize();

    // 4. Return ZIP as base64
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=outputs.zip"
      },
      body: Buffer.concat(chunks).toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("download-all error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

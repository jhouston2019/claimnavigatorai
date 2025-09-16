const archiver = require("archiver");
const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);

    const { data: drafts } = await supabase
      .from("drafts")
      .select("content")
      .eq("email", user.email);

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

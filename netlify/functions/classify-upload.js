const { createClient } = require("@supabase/supabase-js");
const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Simple file upload handling without busboy
    const { file, filename } = JSON.parse(event.body);
    
    if (!file || !filename) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing file or filename" }) };
    }

    // Store file metadata in database
    await supabase.from("documents").insert({
      email: user.email,
      file_name: filename,
      category: "uploaded",
      content: file // Store base64 content
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Upload error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to upload document" }) };
  }
};

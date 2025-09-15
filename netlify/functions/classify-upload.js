const { createClient } = require("@supabase/supabase-js");
const Busboy = require("busboy");
const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const busboy = Busboy({ headers: event.headers });
    let uploadPromise;

    busboy.on("file", (fieldname, file, filename) => {
      const filePath = `${user.email}/${filename}`;
      uploadPromise = supabase.storage
        .from("claimnavigatorai-docs")
        .upload(filePath, file, { upsert: true })
        .then(async ({ error }) => {
          if (error) throw error;
          await supabase.from("documents").insert({
            email: user.email,
            file_name: filename,
            category: "uploaded"
          });
        });
    });

    await new Promise((resolve, reject) => {
      busboy.on("finish", resolve);
      busboy.on("error", reject);
      busboy.end(Buffer.from(event.body, "base64"));
    });

    if (uploadPromise) await uploadPromise;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Upload error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to upload document" }) };
  }
};

const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy'); // parse file uploads

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
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token." }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session." }) };
    }

    // 2. Parse upload with busboy
    const busboy = Busboy({ headers: event.headers });
    let uploadPromise;

    busboy.on("file", (fieldname, file, filename) => {
      const filePath = `${user.id}/${Date.now()}-${filename}`; // namespace per user

      uploadPromise = supabase.storage
        .from("claimnavigatorai-docs")
        .upload(filePath, file, {
          contentType: "application/octet-stream",
          upsert: true,
        })
        .then(async ({ error }) => {
          if (error) throw error;

          // Save metadata in documents table
          await supabase.from("documents").insert([
            {
              email: user.email,
              file_name: filename,
              path: filePath,
              category: "uploaded",
            },
          ]);
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

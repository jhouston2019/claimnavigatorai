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

    const busboy = Busboy({ headers: event.headers });
    let uploadPromise;

    busboy.on("file", (fieldname, file, filename) => {
      const filePath = `${filename}`;
      uploadPromise = supabase.storage
        .from("claimnavigatorai-docs")
        .upload(filePath, file, {
          contentType: "application/octet-stream",
          upsert: true,
        })
        .then(async ({ data, error }) => {
          if (error) throw error;

          // Save metadata in documents table
          await supabase.from("documents").insert([
            {
              email: event.queryStringParameters.email || "unknown",
              file_name: filename,
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

const { createClient } = require('@supabase/supabase-js');
const multiparty = require("multiparty");
const fs = require("fs");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const form = new multiparty.Form();
    const data = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const email = data.fields.email[0];
    const file = data.files.file[0];

    const { data: upload, error } = await supabase.storage
      .from("documents")
      .upload(`${email}/${file.originalFilename}`, fs.createReadStream(file.path), {
        contentType: file.headers["content-type"]
      });

    if (error) throw error;

    await supabase.from("documents").insert({
      email,
      file_name: file.originalFilename,
      path: upload.path,
      category: "uploaded"
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("classify-upload error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};

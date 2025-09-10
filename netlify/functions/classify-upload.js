const multiparty = require("multiparty");
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const form = new multiparty.Form();
    const data = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const email = data.fields.email[0];
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Missing email" }) };

    // For MVP, just save filename as placeholder
    const fileName = data.files.file[0].originalFilename;

    const { error } = await supabase
      .from('documents')
      .insert([{ email, content: `Uploaded document: ${fileName}`, created_at: new Date().toISOString() }]);

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "File classified & saved." }) };
  } catch (err) {
    console.error("classify-upload error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

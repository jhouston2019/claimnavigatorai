const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    // 1. Verify JWT
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing auth token." }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired session." }) };
    }

    // 2. Parse language from body
    const { lang = "en" } = JSON.parse(event.body || "{}");

    // 3. List files in the storage bucket
    const { data, error } = await supabase
      .storage
      .from("documents")
      .list(`${lang}/`, { limit: 100 });

    if (error) throw error;

    // 4. Convert Supabase file entries into usable frontend objects
    const docs = data.map(file => {
      const filePath = `${lang}/${file.name}`;
      return {
        label: file.name.replace(/\.[^/.]+$/, ""), // strip extension
        description: "Insurance Document",
        templatePath: filePath,
        samplePath: filePath
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(docs),
    };

  } catch (err) {
    console.error("list-documents error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to list documents." }),
    };
  }
};

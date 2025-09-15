const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { email, lang } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email." }) };
    }

    const folder = lang || "en";

    const { data, error } = await supabase.storage
      .from('documents')
      .list(folder, { limit: 100 });

    if (error) throw error;

    const docs = data.map(file => ({
      label: file.name.replace(/\.[^/.]+$/, ""), // strip extension
      description: "Insurance Document",
      templatePath: `${folder}/${file.name}`,
      samplePath: `${folder}/${file.name}`
    }));

    return { statusCode: 200, body: JSON.stringify(docs) };

  } catch (err) {
    console.error("Get Documents Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to load documents." }) };
  }
};

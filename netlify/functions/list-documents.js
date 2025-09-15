const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { lang = "en" } = JSON.parse(event.body || "{}");

    // List all files in that language folder
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list(lang + '/', { limit: 100 });

    if (error) throw error;

    // Convert Supabase file entries into usable frontend objects
    const docs = data.map(file => {
      const filePath = `${lang}/${file.name}`;

      return {
        label: file.name.replace(/\.[^/.]+$/, ""), // filename w/out extension
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
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

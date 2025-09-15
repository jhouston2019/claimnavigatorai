const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { lang = "en" } = JSON.parse(event.body || "{}");

    const { data, error } = await supabase
      .storage
      .from("documents")
      .list(`${lang}/`, { limit: 100 });

    if (error) throw error;

    const docs = data.map(file => ({
      label: file.name.replace(/\.[^/.]+$/, ""),
      description: "Insurance Document",
      templatePath: `${lang}/${file.name}`,
      samplePath: `${lang}/${file.name}`
    }));

    return { statusCode: 200, body: JSON.stringify(docs) };
  } catch (err) {
    console.error("list-documents error:", err);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

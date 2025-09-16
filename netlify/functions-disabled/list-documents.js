const { supabase, getUserFromAuth } = require("./utils/auth");
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { lang = "en" } = JSON.parse(event.body || "{}");

    // Load documents from local JSON file
    const documentsPath = path.join(__dirname, `../../assets/docs/${lang}/documents.json`);
    
    if (!fs.existsSync(documentsPath)) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: `Documents for language ${lang} not found` }) 
      };
    }

    const documentsData = JSON.parse(fs.readFileSync(documentsPath, 'utf8'));
    
    // Convert to array format expected by frontend
    const docs = Object.values(documentsData).map(doc => ({
      label: doc.label,
      description: doc.description || "Insurance Document",
      templatePath: doc.templatePath,
      samplePath: doc.samplePath
    }));

    return { statusCode: 200, body: JSON.stringify(docs) };
  } catch (err) {
    console.error("list-documents error:", err);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

const { supabase, getUserFromAuth } = require("./utils/auth");
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    // In development mode, skip authentication
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.CONTEXT === 'dev' ||
                         !event.headers.authorization;
    
    let user = null;
    if (!isDevelopment) {
      user = await getUserFromAuth(event);
    }
    
    const { lang = "en" } = JSON.parse(event.body || "{}");

    // First try to load from Supabase (all 122 documents)
    try {
      console.log(`Loading documents from Supabase for language: ${lang}`);
      console.log('Supabase client available:', !!supabase);
      
      // Query documents from Supabase
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('language', lang)
        .order('label');
        
      console.log('Supabase query result:', { docs: docs?.length, error: error?.message });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (docs && docs.length > 0) {
        console.log(`Loaded ${docs.length} documents from Supabase for language: ${lang}`);
        
        // Convert to array format expected by frontend
        const formattedDocs = docs.map(doc => ({
          label: doc.label,
          description: doc.description || "Insurance Document",
          templatePath: doc.template_path,
          samplePath: doc.sample_path
        }));

        return { statusCode: 200, body: JSON.stringify(formattedDocs) };
      }
    } catch (supabaseError) {
      console.log('Supabase failed, falling back to local JSON files:', supabaseError.message);
    }

    // Fallback to GitHub documents JSON if Supabase fails
    const githubDocumentsPath = path.join(__dirname, `../../assets/data/github-documents.json`);
    
    if (fs.existsSync(githubDocumentsPath)) {
      const githubDocumentsData = JSON.parse(fs.readFileSync(githubDocumentsPath, 'utf8'));
      const filteredDocs = githubDocumentsData.filter(doc => doc.language === lang);
      
      // Convert to array format expected by frontend
      const docs = filteredDocs.map(doc => ({
        label: doc.label,
        description: doc.description || "Insurance Document",
        templatePath: doc.template_path,
        samplePath: doc.sample_path
      }));

      console.log(`Loaded ${docs.length} documents from GitHub JSON for language: ${lang}`);
      return { statusCode: 200, body: JSON.stringify(docs) };
    }

    // Final fallback to local JSON files
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

    console.log(`Loaded ${docs.length} documents from local files for language: ${lang}`);
    return { statusCode: 200, body: JSON.stringify(docs) };
  } catch (err) {
    console.error("list-documents error:", err);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

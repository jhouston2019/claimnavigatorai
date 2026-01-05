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
    
    // Parse request body with error handling
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Invalid JSON in request body",
          success: false 
        })
      };
    }
    
    const { lang = "en" } = requestData;

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
    try {
      console.log('Fetching GitHub documents JSON from web...');
      const response = await fetch(`${process.env.SITE_URL || process.env.URL || 'https://Claim Navigator.com'}/assets/data/github-documents.json`);
      if (response.ok) {
        const githubDocumentsData = await response.json();
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
    } catch (fetchError) {
      console.log('Failed to fetch GitHub documents JSON:', fetchError.message);
    }

    // Final fallback to local document directories
    console.log('Loading documents from local directories...');
    
    let documents = [];
    
    if (lang === 'en') {
      // Load English documents from Document Library - Final English
      const englishDir = path.join(__dirname, '../../Document Library - Final English');
      if (fs.existsSync(englishDir)) {
        const files = fs.readdirSync(englishDir)
          .filter(file => file.endsWith('.pdf') && !file.includes('-sample'))
          .sort();
        
        documents = files.map(file => {
          const name = file.replace('.pdf', '');
          const sampleFile = file.replace('.pdf', '-sample.pdf');
          const sampleExists = fs.existsSync(path.join(englishDir, sampleFile));
          
          return {
            label: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: "Insurance Document",
            templatePath: `https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs/en/${file}`,
            samplePath: sampleExists ? `https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs/en/${sampleFile}` : null
          };
        });
      }
    } else if (lang === 'es') {
      // Load Spanish documents from Document Library - Final Spanish
      const spanishDir = path.join(__dirname, '../../Document Library - Final Spanish');
      if (fs.existsSync(spanishDir)) {
        const files = fs.readdirSync(spanishDir)
          .filter(file => file.endsWith('.pdf') && 
                         !file.includes('-Muestra') && 
                         !file.includes('-Ejemplo') && 
                         !file.includes('Índice') &&
                         !file.includes('Hurricane_Windstorm Claim Letter - Spanish Sample') &&
                         !file.includes('Complete Translation Index') &&
                         !file.includes('Documentos de Reclamación de Seguros') &&
                         !file.includes('Verificación de Daños por Granizada') &&
                         !file.includes('Verificación de Daños por Tormenta Severa') &&
                         !file.includes('Verificación y Documentación de Daños a la Propiedad'))
          .sort();
        
        documents = files.map(file => {
          const name = file.replace('.pdf', '');
          const sampleFile = file.replace('.pdf', '-sample.pdf');
          const sampleExists = fs.existsSync(path.join(spanishDir, sampleFile));
          
          return {
            label: name,
            description: "Documento de Seguros",
            templatePath: `https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs/es/${file}`,
            samplePath: sampleExists ? `https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs/es/${sampleFile}` : null
          };
        });
      }
    }
    
    console.log(`Loaded ${documents.length} documents from local directories for language: ${lang}`);
    return { statusCode: 200, body: JSON.stringify(documents) };
  } catch (err) {
    console.error("list-documents error:", err);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

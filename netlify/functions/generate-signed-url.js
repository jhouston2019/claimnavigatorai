const { supabase, getUserFromAuth } = require("./utils/auth");
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { fileName } = JSON.parse(event.body);

    if (!fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fileName" }) };
    }

    // Check if fileName is already a GitHub URL
    if (fileName.startsWith('https://raw.githubusercontent.com/')) {
      console.log(`Direct GitHub URL provided: ${fileName}`);
      return { statusCode: 200, body: JSON.stringify({ url: fileName }) };
    }

    // First try to generate signed URL from Supabase storage
    try {
      console.log(`Generating signed URL from Supabase for: ${fileName}`);
      
      // Handle both old folder structure and new flat structure
      let storagePath = fileName;
      if (fileName.includes('/')) {
        // Old structure: en/filename.pdf or es/filename.pdf
        storagePath = fileName;
      } else {
        // New flat structure: en_filename.pdf or es_filename.pdf
        // Convert from template_path format to storage format
        if (fileName.startsWith('en/')) {
          storagePath = fileName.replace('en/', 'en_');
        } else if (fileName.startsWith('es/')) {
          storagePath = fileName.replace('es/', 'es_');
        }
      }
      
      const { data, error } = await supabase
        .storage
        .from('claimnavigatorai-docs')
        .createSignedUrl(storagePath, 60 * 5); // URL expires in 5 minutes

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      if (data && data.signedUrl) {
        console.log(`Generated signed URL from Supabase for: ${storagePath}`);
        return { statusCode: 200, body: JSON.stringify({ url: data.signedUrl }) };
      }
    } catch (supabaseError) {
      console.log('Supabase storage failed, falling back to GitHub:', supabaseError.message);
    }

    // Fallback to GitHub URLs if Supabase fails
    const githubBaseUrl = 'https://raw.githubusercontent.com/jhouston2019/claimnavigatorai/main/docs';
    let githubUrl;
    
    if (fileName.startsWith('en/')) {
      githubUrl = `${githubBaseUrl}/en/${encodeURIComponent(fileName.replace('en/', ''))}`;
    } else if (fileName.startsWith('es/')) {
      githubUrl = `${githubBaseUrl}/es/${encodeURIComponent(fileName.replace('es/', ''))}`;
    } else {
      // Try to determine language from file name or default to English
      githubUrl = `${githubBaseUrl}/en/${encodeURIComponent(fileName)}`;
    }

    console.log(`Generated GitHub URL for: ${fileName} -> ${githubUrl}`);
    return { statusCode: 200, body: JSON.stringify({ url: githubUrl }) };
  } catch (err) {
    console.error("Signed URL Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate signed URL." }) };
  }
};

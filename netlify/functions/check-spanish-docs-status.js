const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing Supabase environment variables'
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'claimnavigatorai-docs';

    const results = {
      local: {
        spanishDir: null,
        totalFiles: 0,
        files: []
      },
      storage: {
        bucketExists: false,
        esFolderExists: false,
        uploadedFiles: 0,
        files: []
      },
      comparison: {
        missing: [],
        extra: []
      }
    };

    // Check local Spanish directory
    const spanishDir = path.join(__dirname, '../../Document Library - Final Spanish');
    if (fs.existsSync(spanishDir)) {
      const localFiles = fs.readdirSync(spanishDir).filter(file => file.endsWith('.pdf'));
      results.local.spanishDir = spanishDir;
      results.local.totalFiles = localFiles.length;
      results.local.files = localFiles.sort();
    }

    // Check Supabase storage
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (!bucketsError) {
        const bucket = buckets.find(b => b.name === bucketName);
        results.storage.bucketExists = !!bucket;
      }

      // Check es/ folder
      const { data: esFiles, error: esError } = await supabase.storage
        .from(bucketName)
        .list('es', { limit: 1000 });
      
      if (!esError && esFiles) {
        results.storage.esFolderExists = true;
        results.storage.uploadedFiles = esFiles.length;
        results.storage.files = esFiles.map(f => f.name).sort();
      } else {
        results.storage.error = esError?.message;
      }
    } catch (storageError) {
      results.storage.error = storageError.message;
    }

    // Compare local vs storage
    if (results.local.files.length > 0 && results.storage.files.length > 0) {
      const localSet = new Set(results.local.files);
      const storageSet = new Set(results.storage.files);
      
      // Find missing files (in local but not in storage)
      results.comparison.missing = results.local.files.filter(file => !storageSet.has(file));
      
      // Find extra files (in storage but not in local)
      results.comparison.extra = results.storage.files.filter(file => !localSet.has(file));
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Spanish documents status check complete',
        results,
        summary: {
          localFiles: results.local.totalFiles,
          uploadedFiles: results.storage.uploadedFiles,
          missingFiles: results.comparison.missing.length,
          extraFiles: results.comparison.extra.length,
          uploadComplete: results.comparison.missing.length === 0 && results.local.totalFiles > 0
        }
      })
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Unexpected error occurred', 
        details: error.message 
      })
    };
  }
};

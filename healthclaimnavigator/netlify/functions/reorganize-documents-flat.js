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
      english: { uploaded: 0, failed: 0, errors: [] },
      spanish: { uploaded: 0, failed: 0, errors: [] },
      cleanup: { deleted: 0, errors: [] }
    };

    // First, clear existing folder structure
    console.log('Clearing existing folder structure...');
    try {
      // Delete en/ folder contents
      const { data: enFiles } = await supabase.storage
        .from(bucketName)
        .list('en', { limit: 1000 });
      
      if (enFiles && enFiles.length > 0) {
        const enPaths = enFiles.map(f => `en/${f.name}`);
        const { error: enDeleteError } = await supabase.storage
          .from(bucketName)
          .remove(enPaths);
        
        if (enDeleteError) {
          results.cleanup.errors.push({ folder: 'en', error: enDeleteError.message });
        } else {
          results.cleanup.deleted += enFiles.length;
        }
      }

      // Delete es/ folder contents
      const { data: esFiles } = await supabase.storage
        .from(bucketName)
        .list('es', { limit: 1000 });
      
      if (esFiles && esFiles.length > 0) {
        const esPaths = esFiles.map(f => `es/${f.name}`);
        const { error: esDeleteError } = await supabase.storage
          .from(bucketName)
          .remove(esPaths);
        
        if (esDeleteError) {
          results.cleanup.errors.push({ folder: 'es', error: esDeleteError.message });
        } else {
          results.cleanup.deleted += esFiles.length;
        }
      }
    } catch (cleanupError) {
      results.cleanup.errors.push({ error: cleanupError.message });
    }

    // Upload English documents directly to bucket root
    const englishDir = path.join(__dirname, '../../Document Library - Final English');
    if (fs.existsSync(englishDir)) {
      const englishFiles = fs.readdirSync(englishDir).filter(file => file.endsWith('.pdf'));
      console.log(`Uploading ${englishFiles.length} English documents...`);
      
      for (const file of englishFiles) {
        try {
          const filePath = path.join(englishDir, file);
          const fileBuffer = fs.readFileSync(filePath);
          
          // Upload directly to bucket root with en_ prefix
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`en_${file}`, fileBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (error) {
            results.english.failed++;
            results.english.errors.push({ file, error: error.message });
          } else {
            results.english.uploaded++;
          }
          
          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (fileError) {
          results.english.failed++;
          results.english.errors.push({ file, error: fileError.message });
        }
      }
    }

    // Upload Spanish documents directly to bucket root
    const spanishDir = path.join(__dirname, '../../Document Library - Final Spanish');
    if (fs.existsSync(spanishDir)) {
      const spanishFiles = fs.readdirSync(spanishDir).filter(file => file.endsWith('.pdf'));
      console.log(`Uploading ${spanishFiles.length} Spanish documents...`);
      
      for (const file of spanishFiles) {
        try {
          const filePath = path.join(spanishDir, file);
          const fileBuffer = fs.readFileSync(filePath);
          
          // Upload directly to bucket root with es_ prefix
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`es_${file}`, fileBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (error) {
            results.spanish.failed++;
            results.spanish.errors.push({ file, error: error.message });
          } else {
            results.spanish.uploaded++;
          }
          
          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (fileError) {
          results.spanish.failed++;
          results.spanish.errors.push({ file, error: fileError.message });
        }
      }
    }

    const totalUploaded = results.english.uploaded + results.spanish.uploaded;
    const totalFailed = results.english.failed + results.spanish.failed;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Reorganization complete: ${totalUploaded} documents uploaded, ${totalFailed} failed`,
        results,
        summary: {
          totalUploaded,
          totalFailed,
          englishUploaded: results.english.uploaded,
          spanishUploaded: results.spanish.uploaded,
          filesDeleted: results.cleanup.deleted,
          structure: 'All documents now in bucket root with en_/es_ prefixes'
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

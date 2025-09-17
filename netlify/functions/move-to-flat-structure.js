const { createClient } = require('@supabase/supabase-js');

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
      moved: 0,
      failed: 0,
      errors: []
    };

    // Get all files from en/ folder
    const { data: enFiles, error: enListError } = await supabase.storage
      .from(bucketName)
      .list('en', { limit: 1000 });

    if (enListError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to list en/ folder',
          details: enListError.message
        })
      };
    }

    // Move English files from en/ to root with en_ prefix
    if (enFiles && enFiles.length > 0) {
      console.log(`Moving ${enFiles.length} English files to flat structure...`);
      
      for (const file of enFiles) {
        try {
          // Download from en/filename.pdf
          const { data: downloadData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(`en/${file.name}`);
          
          if (downloadError) {
            results.failed++;
            results.errors.push({ file: file.name, error: `Download failed: ${downloadError.message}` });
            continue;
          }

          // Upload to root as en_filename.pdf
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`en_${file.name}`, downloadData, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            results.failed++;
            results.errors.push({ file: file.name, error: `Upload failed: ${uploadError.message}` });
          } else {
            results.moved++;
            console.log(`Moved: en/${file.name} -> en_${file.name}`);
          }
          
        } catch (fileError) {
          results.failed++;
          results.errors.push({ file: file.name, error: fileError.message });
        }
      }
    }

    // Get all files from es/ folder
    const { data: esFiles, error: esListError } = await supabase.storage
      .from(bucketName)
      .list('es', { limit: 1000 });

    if (esListError) {
      console.error('Failed to list es/ folder:', esListError.message);
    } else if (esFiles && esFiles.length > 0) {
      console.log(`Moving ${esFiles.length} Spanish files to flat structure...`);
      
      for (const file of esFiles) {
        try {
          // Download from es/filename.pdf
          const { data: downloadData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(`es/${file.name}`);
          
          if (downloadError) {
            results.failed++;
            results.errors.push({ file: file.name, error: `Download failed: ${downloadError.message}` });
            continue;
          }

          // Upload to root as es_filename.pdf
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`es_${file.name}`, downloadData, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            results.failed++;
            results.errors.push({ file: file.name, error: `Upload failed: ${uploadError.message}` });
          } else {
            results.moved++;
            console.log(`Moved: es/${file.name} -> es_${file.name}`);
          }
          
        } catch (fileError) {
          results.failed++;
          results.errors.push({ file: file.name, error: fileError.message });
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Moved ${results.moved} files to flat structure, ${results.failed} failed`,
        results,
        summary: {
          totalMoved: results.moved,
          totalFailed: results.failed,
          englishFiles: enFiles?.length || 0,
          spanishFiles: esFiles?.length || 0
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

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Initialize Supabase client
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
          error: 'Missing Supabase environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnyKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
          }
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create the documents bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to list buckets',
          details: bucketsError.message
        })
      };
    }

    const documentsBucketExists = buckets.some(bucket => bucket.name === 'documents');
    
    if (!documentsBucketExists) {
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: true
      });

      if (createError) {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Failed to create documents bucket',
            details: createError.message
          })
        };
      }
    }

    const results = {
      english: { uploaded: 0, failed: 0, errors: [] },
      spanish: { uploaded: 0, failed: 0, errors: [] }
    };

    // Function to upload files from a directory
    const uploadFilesFromDirectory = async (directory, language) => {
      try {
        const files = fs.readdirSync(directory).filter(file => file.endsWith('.pdf'));
        
        for (const file of files) {
          try {
            const filePath = path.join(directory, file);
            const fileBuffer = fs.readFileSync(filePath);
            
            // Upload to Supabase Storage with proper folder structure
            const folderName = language === 'english' ? 'en' : 'es';
            const { data, error } = await supabase.storage
              .from('documents')
              .upload(`${folderName}/${file}`, fileBuffer, {
                contentType: 'application/pdf',
                upsert: true
              });

            if (error) {
              console.error(`Error uploading ${file}:`, error);
              results[language].failed++;
              results[language].errors.push(`${file}: ${error.message}`);
            } else {
              console.log(`Successfully uploaded ${file}`);
              results[language].uploaded++;
            }
          } catch (fileError) {
            console.error(`Error processing ${file}:`, fileError);
            results[language].failed++;
            results[language].errors.push(`${file}: ${fileError.message}`);
          }
        }
      } catch (dirError) {
        console.error(`Error reading directory ${directory}:`, dirError);
        results[language].errors.push(`Directory error: ${dirError.message}`);
      }
    };

    // Upload English documents
    const englishDir = path.join(__dirname, '../../Document Library - Final English');
    if (fs.existsSync(englishDir)) {
      await uploadFilesFromDirectory(englishDir, 'english');
    } else {
      results.english.errors.push('English directory not found');
    }

    // Upload Spanish documents
    const spanishDir = path.join(__dirname, '../../Document Library - Final Spanish');
    if (fs.existsSync(spanishDir)) {
      await uploadFilesFromDirectory(spanishDir, 'spanish');
    } else {
      results.spanish.errors.push('Spanish directory not found');
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
        message: `Upload complete: ${totalUploaded} files uploaded, ${totalFailed} failed`,
        results: results,
        summary: {
          totalUploaded: totalUploaded,
          totalFailed: totalFailed,
          englishUploaded: results.english.uploaded,
          spanishUploaded: results.spanish.uploaded,
          bucketCreated: !documentsBucketExists
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

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
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get list of PDF files from local directories
    const englishDir = path.join(__dirname, '../../Document Library - Final English');
    const spanishDir = path.join(__dirname, '../../Document Library - Final Spanish');

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
              results[language].failed++;
              results[language].errors.push(`${file}: ${error.message}`);
              console.error(`Failed to upload ${file}:`, error);
            } else {
              results[language].uploaded++;
              console.log(`Successfully uploaded ${file}`);
            }
          } catch (fileError) {
            results[language].failed++;
            results[language].errors.push(`${file}: ${fileError.message}`);
            console.error(`Error processing ${file}:`, fileError);
          }
        }
      } catch (dirError) {
        results[language].errors.push(`Directory error: ${dirError.message}`);
        console.error(`Error reading directory ${directory}:`, dirError);
      }
    };

    // Upload English documents
    console.log('Uploading English documents...');
    await uploadFilesFromDirectory(englishDir, 'english');

    // Upload Spanish documents
    console.log('Uploading Spanish documents...');
    await uploadFilesFromDirectory(spanishDir, 'spanish');

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
        message: 'Document upload process completed',
        summary: {
          totalUploaded,
          totalFailed,
          english: results.english,
          spanish: results.spanish
        },
        nextSteps: [
          '1. Run populate-documents function to add metadata',
          '2. Test document access in Claim Resource & AI Response Center'
        ]
      })
    };

  } catch (error) {
    console.error('Error uploading documents:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

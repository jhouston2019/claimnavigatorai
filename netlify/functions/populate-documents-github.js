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
    const githubBaseUrl = 'https://raw.githubusercontent.com/jhouston2019/Claim Navigator/main/docs';

    const results = {
      english: { updated: 0, failed: 0, errors: [] },
      spanish: { updated: 0, failed: 0, errors: [] }
    };

    // Clear existing documents
    console.log('Clearing existing documents table...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      console.error('Error clearing documents table:', deleteError);
    }

    // Process English documents
    const englishDir = path.join(__dirname, '../../docs/en');
    if (fs.existsSync(englishDir)) {
      const englishFiles = fs.readdirSync(englishDir).filter(file => file.endsWith('.pdf'));
      console.log(`Processing ${englishFiles.length} English documents...`);
      
      for (const file of englishFiles) {
        try {
          const slug = file.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const label = file.replace('.pdf', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const githubUrl = `${githubBaseUrl}/en/${encodeURIComponent(file)}`;
          
          const { data, error } = await supabase
            .from('documents')
            .insert([
              {
                slug: slug,
                label: label,
                language: 'en',
                template_path: githubUrl,
                sample_path: null
              }
            ]);

          if (error) {
            results.english.failed++;
            results.english.errors.push({ file, error: error.message });
          } else {
            results.english.updated++;
          }
          
        } catch (fileError) {
          results.english.failed++;
          results.english.errors.push({ file, error: fileError.message });
        }
      }
    }

    // Process Spanish documents
    const spanishDir = path.join(__dirname, '../../docs/es');
    if (fs.existsSync(spanishDir)) {
      const spanishFiles = fs.readdirSync(spanishDir).filter(file => file.endsWith('.pdf'));
      console.log(`Processing ${spanishFiles.length} Spanish documents...`);
      
      for (const file of spanishFiles) {
        try {
          const slug = file.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const label = file.replace('.pdf', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const githubUrl = `${githubBaseUrl}/es/${encodeURIComponent(file)}`;
          
          const { data, error } = await supabase
            .from('documents')
            .insert([
              {
                slug: slug,
                label: label,
                language: 'es',
                template_path: githubUrl,
                sample_path: null
              }
            ]);

          if (error) {
            results.spanish.failed++;
            results.spanish.errors.push({ file, error: error.message });
          } else {
            results.spanish.updated++;
          }
          
        } catch (fileError) {
          results.spanish.failed++;
          results.spanish.errors.push({ file, error: fileError.message });
        }
      }
    }

    const totalUpdated = results.english.updated + results.spanish.updated;
    const totalFailed = results.english.failed + results.spanish.failed;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Documents table updated with GitHub URLs: ${totalUpdated} documents, ${totalFailed} failed`,
        results,
        summary: {
          totalUpdated,
          totalFailed,
          englishUpdated: results.english.updated,
          spanishUpdated: results.spanish.updated,
          storage: 'GitHub CDN',
          baseUrl: githubBaseUrl
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

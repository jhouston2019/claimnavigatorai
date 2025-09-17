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

    // Read the GitHub documents JSON file
    const jsonPath = path.join(__dirname, '../../assets/data/github-documents.json');
    
    if (!fs.existsSync(jsonPath)) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'GitHub documents JSON file not found'
        })
      };
    }

    const documentsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Found ${documentsData.length} documents in JSON file`);

    // Clear existing documents
    console.log('Clearing existing documents table...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      console.error('Error clearing documents table:', deleteError);
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    // Insert documents in batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < documentsData.length; i += batchSize) {
      const batch = documentsData.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('documents')
          .insert(batch);

        if (error) {
          results.failed += batch.length;
          results.errors.push({ batch: i, error: error.message });
          console.error(`Batch ${i} failed:`, error.message);
        } else {
          results.updated += batch.length;
          console.log(`Batch ${i} completed: ${batch.length} documents inserted`);
        }
      } catch (batchError) {
        results.failed += batch.length;
        results.errors.push({ batch: i, error: batchError.message });
        console.error(`Batch ${i} error:`, batchError.message);
      }
    }

    const englishCount = documentsData.filter(d => d.language === 'en').length;
    const spanishCount = documentsData.filter(d => d.language === 'es').length;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Documents table populated with GitHub URLs: ${results.updated} documents, ${results.failed} failed`,
        results,
        summary: {
          totalUpdated: results.updated,
          totalFailed: results.failed,
          englishDocuments: englishCount,
          spanishDocuments: spanishCount,
          storage: 'GitHub CDN',
          source: 'github-documents.json'
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

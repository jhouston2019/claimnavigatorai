const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Supabase environment variables' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear existing documents
    console.log('Clearing existing documents...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('Error clearing documents:', deleteError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to clear existing documents', details: deleteError.message })
      };
    }

    const results = {
      english: { processed: 0, inserted: 0, errors: [] },
      spanish: { processed: 0, inserted: 0, errors: [] }
    };

    // Process English documents
    console.log('Processing English documents...');
    const englishFolder = path.join(__dirname, '../../Document Library - Final English');
    const englishFiles = fs.readdirSync(englishFolder)
      .filter(file => file.endsWith('.pdf'))
      .sort();

    console.log(`Found ${englishFiles.length} English PDF files`);

    const englishDocuments = englishFiles.map((file) => {
      // Extract document name from filename
      let documentName = file.replace('.pdf', '');
      
      // Convert to readable label
      const label = documentName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        slug: documentName,
        label: label,
        language: 'en',
        template_path: file,
        sample_path: null
      };
    });

    // Process Spanish documents
    console.log('Processing Spanish documents...');
    const spanishFolder = path.join(__dirname, '../../Document Library - Final Spanish');
    const spanishFiles = fs.readdirSync(spanishFolder)
      .filter(file => file.endsWith('.pdf'))
      .sort();

    console.log(`Found ${spanishFiles.length} Spanish PDF files`);

    const spanishDocuments = spanishFiles.map((file) => {
      // Extract document name from filename
      let documentName = file.replace('.pdf', '');
      
      // Convert to readable label (keep Spanish titles as they are)
      const label = documentName
        .replace(/\s+/g, ' ')
        .trim();
      
      return {
        slug: documentName,
        label: label,
        language: 'es',
        template_path: file,
        sample_path: null
      };
    });

    // Combine all documents
    const allDocuments = [...englishDocuments, ...spanishDocuments];
    console.log(`Total documents to insert: ${allDocuments.length} (${englishDocuments.length} English + ${spanishDocuments.length} Spanish)`);

    // Insert documents in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('documents')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: `Failed to insert batch ${Math.floor(i/batchSize) + 1}`, 
            details: error.message 
          })
        };
      }

      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedCount}/${allDocuments.length} documents`);
    }

    // Verify the counts
    const { count: englishCount, error: englishCountError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'en');

    const { count: spanishCount, error: spanishCountError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'es');

    if (englishCountError) console.error('Error counting English documents:', englishCountError);
    if (spanishCountError) console.error('Error counting Spanish documents:', spanishCountError);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Successfully populated ${insertedCount} documents (${englishDocuments.length} English + ${spanishDocuments.length} Spanish)`,
        details: {
          totalDocuments: insertedCount,
          englishDocuments: {
            processed: englishDocuments.length,
            inserted: englishCount || englishDocuments.length
          },
          spanishDocuments: {
            processed: spanishDocuments.length,
            inserted: spanishCount || spanishDocuments.length
          },
          batchSize: batchSize,
          batchesProcessed: Math.ceil(allDocuments.length / batchSize)
        }
      })
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Unexpected error occurred', 
        details: error.message 
      })
    };
  }
};

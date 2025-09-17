const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
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

    // Get list of all PDF files from English folder
    const englishFolder = path.join(__dirname, '../../Document Library - Final English');
    const pdfFiles = fs.readdirSync(englishFolder)
      .filter(file => file.endsWith('.pdf'))
      .sort();

    console.log(`Found ${pdfFiles.length} PDF files in English folder`);

    // Create document entries for each PDF file
    const documents = pdfFiles.map((file, index) => {
      // Extract document name from filename
      let documentName = file.replace('.pdf', '');
      
      // Handle sample files
      const isSample = documentName.includes('-sample');
      if (isSample) {
        documentName = documentName.replace('-sample', '');
      }
      
      // Convert to readable label
      const label = documentName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Create slug from filename
      const slug = file.replace('.pdf', '');
      
      return {
        slug: slug,
        label: label,
        language: 'en',
        template_path: file,
        sample_path: null
      };
    });

    console.log(`Creating ${documents.length} document entries...`);

    // Insert documents in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
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
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedCount}/${documents.length} documents`);
    }

    // Verify the count
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'en');

    if (countError) {
      console.error('Error counting documents:', countError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Successfully populated ${insertedCount} English documents`,
        totalDocuments: insertedCount,
        verifiedCount: count || insertedCount,
        details: {
          englishDocuments: insertedCount,
          pdfFilesProcessed: pdfFiles.length,
          batchSize: batchSize,
          batchesProcessed: Math.ceil(documents.length / batchSize)
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

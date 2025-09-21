exports.handler = async (event, context) => {
  try {
    const { lang = "en" } = JSON.parse(event.body || "{}");
    
    console.log(`Testing documents for language: ${lang}`);
    
    // Try to fetch GitHub documents JSON
    try {
      console.log('Fetching GitHub documents JSON...');
      const response = await fetch('https://claimnavigatorai.com/assets/data/github-documents.json');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const githubDocumentsData = await response.json();
        console.log(`Total documents in JSON: ${githubDocumentsData.length}`);
        
        const filteredDocs = githubDocumentsData.filter(doc => doc.language === lang);
        console.log(`Filtered documents for ${lang}: ${filteredDocs.length}`);
        
        // Convert to array format expected by frontend
        const docs = filteredDocs.map(doc => ({
          label: doc.label,
          description: doc.description || "Insurance Document",
          templatePath: doc.template_path,
          samplePath: doc.sample_path
        }));

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            message: `Found ${docs.length} documents for language ${lang}`,
            documents: docs.slice(0, 5), // Return first 5 for testing
            total: docs.length
          })
        };
      } else {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: `Failed to fetch GitHub documents JSON. Status: ${response.status}`
          })
        };
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: `Fetch error: ${fetchError.message}`
        })
      };
    }
  } catch (err) {
    console.error("test-documents error:", err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};

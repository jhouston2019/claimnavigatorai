exports.handler = async (event) => {
  try {
    // Parse request body
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Invalid JSON in request body" 
        })
      };
    }

    const { content, type = 'claim_document', title = 'Generated Document' } = requestData;

    if (!content) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Content is required" 
        })
      };
    }

    console.log("Generating document:", type, title);

    // Mock document generation for testing
    const mockDocument = {
      id: 'doc-' + Date.now(),
      title: title,
      type: type,
      content: content,
      generatedAt: new Date().toISOString(),
      downloadUrl: '#mock-download-url',
      status: 'generated'
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        document: mockDocument,
        message: "Document generated successfully (mock)"
      })
    };

  } catch (error) {
    console.error("Error in generate-document-simple:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      })
    };
  }
};

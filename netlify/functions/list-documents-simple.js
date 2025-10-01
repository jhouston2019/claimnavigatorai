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

    const { language = 'en', type = 'claim_documents' } = requestData;

    console.log("Loading documents for:", language, type);

    // Mock document data for testing
    const mockDocuments = [
      {
        id: 'doc-001',
        name: 'Insurance Claim Response Letter Template',
        type: 'Response Letter',
        date: '2025-01-27',
        hasTemplate: true
      },
      {
        id: 'doc-002', 
        name: 'Evidence Documentation Package',
        type: 'Evidence',
        date: '2025-01-27',
        hasTemplate: true
      },
      {
        id: 'doc-003',
        name: 'Policy Analysis Report',
        type: 'Analysis',
        date: '2025-01-27',
        hasTemplate: false
      },
      {
        id: 'doc-004',
        name: 'Appeal Letter Template',
        type: 'Appeal',
        date: '2025-01-27',
        hasTemplate: true
      },
      {
        id: 'doc-005',
        name: 'Settlement Negotiation Script',
        type: 'Negotiation',
        date: '2025-01-27',
        hasTemplate: true
      }
    ];

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        documents: mockDocuments,
        language: language,
        type: type,
        count: mockDocuments.length
      })
    };

  } catch (error) {
    console.error("Error in list-documents-simple:", error);
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

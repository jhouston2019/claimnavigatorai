const OpenAI = require('openai');

// Import document metadata
const metadata = require('../../assets/data/document-metadata.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { documentType, formData, content } = JSON.parse(event.body || '{}');
    
    if (!documentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Document type is required' }),
      };
    }

    // Find document metadata
    const doc = metadata.find((d) => d.id === documentType);
    
    if (!doc) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Unknown document type' }),
      };
    }

    // Build the AI prompt based on document metadata
    const basePrompt = buildPrompt(doc, formData, content);
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are ClaimNavigatorAI, an expert in insurance documentation. Generate professional, legally sound insurance documents with proper formatting based on the document type and metadata provided.'
        },
        {
          role: 'user',
          content: basePrompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.6,
    });

    const generatedContent = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        documentType: doc.title,
        content: generatedContent,
        metadata: doc
      }),
    };

  } catch (error) {
    console.error('Document generation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate document',
        details: error.message,
      }),
    };
  }
};

function buildPrompt(doc, formData, userContent) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let prompt = `Generate a professional ${doc.title} (${doc.category}) with the following specifications:

DOCUMENT METADATA:
- Type: ${doc.title}
- Category: ${doc.category}
- Format: ${doc.format}
${doc.tone ? `- Tone: ${doc.tone}` : ''}
${doc.sections ? `- Sections: ${doc.sections.join(', ')}` : ''}
${doc.fields ? `- Fields: ${doc.fields.join(', ')}` : ''}
${doc.columns ? `- Columns: ${doc.columns.join(', ')}` : ''}
${doc.items ? `- Checklist Items: ${doc.items.join(', ')}` : ''}

CLAIM INFORMATION:
- Policyholder: ${formData?.name || 'Not provided'}
- Policy Number: ${formData?.policyNumber || 'Not provided'}
- Claim Number: ${formData?.claimNumber || 'Not provided'}
- Date of Loss: ${formData?.dateOfLoss || 'Not provided'}
- Insurance Company: ${formData?.insuranceCompany || 'Not provided'}
- Email: ${formData?.email || 'Not provided'}
- Phone: ${formData?.phone || 'Not provided'}
- Address: ${formData?.address || 'Not provided'}

USER SITUATION:
${userContent || 'General claim assistance needed'}

FORMATTING REQUIREMENTS:
`;

  // Add specific formatting instructions based on document format
  switch (doc.format) {
    case 'narrative':
      prompt += `- Format as a formal letter with proper salutation and closing
- Use paragraph structure with clear sections
- Include professional tone appropriate for ${doc.tone || 'professional'} communication
- Add proper letterhead structure with date (${today})
- Include signature block`;
      break;
      
    case 'fields':
      prompt += `- Format as a structured form with "Field: Value" pairs
- Use clear labels for each field
- Organize information in logical groups
- Include all required fields from the metadata
- Use professional formatting with clear separation`;
      break;
      
    case 'sectioned':
      prompt += `- Format as a structured report with clear section headings
- Use <h2> tags for section headers
- Include all sections from metadata: ${doc.sections?.join(', ')}
- Use bullet points or numbered lists where appropriate
- Maintain professional report formatting`;
      break;
      
    case 'table':
      prompt += `- Format as a table with proper headers
- Use <table>, <tr>, <th>, <td> HTML tags
- Include column headers: ${doc.columns?.join(', ')}
- Add sample data rows to demonstrate format
- Use professional table styling`;
      break;
      
    case 'checklist':
      prompt += `- Format as a bulleted checklist
- Use checkbox symbols (☐) for each item
- Include all items from metadata: ${doc.items?.join(', ')}
- Organize in logical groups
- Use clear, actionable language`;
      break;
      
    case 'contract':
      prompt += `- Format as a formal agreement with numbered clauses
- Use professional contract language
- Include proper legal structure
- Add signature blocks for all parties
- Use formal legal formatting`;
      break;
      
    default:
      prompt += `- Use professional document formatting
- Include appropriate headers and structure
- Maintain consistent formatting throughout`;
  }

  prompt += `

CRITICAL REQUIREMENTS:
1. Generate ONLY the document content - NO CSS styling, NO template instructions, NO placeholder text
2. Include claim information in a professional header format at the top
3. Use clean, professional formatting with proper document structure
4. Make it ready-to-submit and professional
5. Do NOT include any instructional text, CSS, or template placeholders
6. Do NOT include "Instructions for Use" or any template guidance
7. Do NOT include CSS styling or HTML head elements
8. Focus ONLY on the actual document content that would be submitted
9. Replace ALL placeholders with actual information from the claim data provided
10. Generate a complete, professional document ready for immediate submission

Format as clean HTML with proper structure but NO styling, NO instructions, NO placeholders.

Generate the complete document now:`;

  return prompt;
}
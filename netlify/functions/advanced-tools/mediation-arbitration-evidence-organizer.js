/**
 * Mediation / Arbitration Evidence Organizer
 * Organize and prepare evidence packages for dispute resolution
 */

const { runToolAI } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { disputeType, fileUrls } = body;

    if (!disputeType || !fileUrls || fileUrls.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI service not configured' })
      };
    }

    // Auto-tag evidence files
    const tags = fileUrls.map((url, index) => {
      // Extract filename from URL
      const fileName = url.split('/').pop() || `file_${index + 1}`;
      
      // Basic categorization based on filename
      const categories = [];
      const fileNameLower = fileName.toLowerCase();
      
      if (fileNameLower.includes('photo') || fileNameLower.includes('image') || fileNameLower.match(/\.(jpg|jpeg|png)$/)) {
        categories.push('photo');
      }
      if (fileNameLower.includes('scope') || fileNameLower.includes('estimate')) {
        categories.push('scope');
      }
      if (fileNameLower.includes('receipt') || fileNameLower.includes('invoice')) {
        categories.push('receipt');
      }
      if (fileNameLower.includes('communication') || fileNameLower.includes('email') || fileNameLower.includes('letter')) {
        categories.push('communication');
      }
      if (fileNameLower.includes('inspection') || fileNameLower.includes('report')) {
        categories.push('inspection');
      }
      if (categories.length === 0) {
        categories.push('other');
      }

      return {
        fileName: fileName,
        url: url,
        categories: categories,
        relevance: 'High',
        severity: 'Medium'
      };
    });

    // Generate evidence package using AI
    const userPrompt = `For a ${disputeType} proceeding, organize the following evidence files into a comprehensive evidence package:

Files:
${fileUrls.map((url, i) => `${i + 1}. ${url.split('/').pop()}`).join('\n')}

Provide:
1. Exhibits: A numbered list of exhibits with descriptions of what each file contains and its relevance to the dispute.

2. Chronology: A chronological timeline of events based on the evidence files, including dates and key events.

3. Arguments: Key arguments that can be made using this evidence, organized by theme or legal point.

Format each section clearly. Keep the tone professional and objective.`;

    const evidencePackage = await runToolAI('mediation-arbitration-evidence-organizer', userPrompt);

    // Parse the package into structured sections
    const sections = parseEvidencePackage(evidencePackage);

    // Store in database if user is authenticated
    if (process.env.SUPABASE_URL && body.userId) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase.from('evidence_packages').insert({
          user_id: body.userId,
          dispute_type: disputeType,
          files: fileUrls,
          tags: tags,
          evidence_output: sections
        });
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue even if storage fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tags: tags,
        exhibits: sections.exhibits || evidencePackage,
        chronology: sections.chronology || '',
        arguments: sections.arguments || ''
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function parseEvidencePackage(text) {
  const sections = {
    exhibits: '',
    chronology: '',
    arguments: ''
  };

  // Try to extract sections by headings
  const exhibitsMatch = text.match(/Exhibits:?\s*([\s\S]*?)(?=Chronology|Arguments|$)/i);
  if (exhibitsMatch) {
    sections.exhibits = exhibitsMatch[1].trim();
  }

  const chronologyMatch = text.match(/Chronology:?\s*([\s\S]*?)(?=Arguments|$)/i);
  if (chronologyMatch) {
    sections.chronology = chronologyMatch[1].trim();
  }

  const argumentsMatch = text.match(/Arguments:?\s*([\s\S]*?)$/i);
  if (argumentsMatch) {
    sections.arguments = argumentsMatch[1].trim();
  }

  // If no sections found, return full text in exhibits
  if (!sections.exhibits && !sections.chronology) {
    sections.exhibits = text;
  }

  return sections;
}


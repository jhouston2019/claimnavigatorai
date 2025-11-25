/**
 * Expert Opinion Generator
 * Generate professional expert opinions based on evidence
 */

const { runToolAI } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');
const pdfParse = require('pdf-parse');

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
    const { situationDescription, expertType, fileUrls } = body;

    if (!situationDescription || !expertType) {
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

    // Extract text from uploaded files if provided
    let extractedText = '';
    if (fileUrls && fileUrls.length > 0) {
      // Note: In production, you would fetch and parse these files
      // For now, we'll include file URLs in the context
      extractedText = `\n\nUploaded files: ${fileUrls.join(', ')}`;
    }

    const userPrompt = `Generate a comprehensive expert opinion based on the following situation:

Situation Description:
${situationDescription}
${extractedText}

Expert Type: ${expertType}

Provide a structured expert opinion with the following sections:

1. Cause Analysis: Identify the likely cause(s) of the damage or issue, based on the description provided.

2. Severity Assessment: Evaluate the severity of the damage or issue, including any immediate concerns or long-term implications.

3. Documentation Requirements: List what additional documentation, photos, or evidence would strengthen this opinion.

4. Recommendations: Provide professional recommendations for addressing the issue, including repair approaches, preventive measures, or further investigation needed.

Format each section clearly. Keep the tone professional and objective.`;

    const opinionText = await runToolAI('expert-opinion-generator', userPrompt);

    // Parse the opinion into structured sections
    const sections = parseOpinionSections(opinionText);

    // Store in database if user is authenticated
    if (process.env.SUPABASE_URL && body.userId) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase.from('expert_opinions').insert({
          user_id: body.userId,
          input_data: {
            situationDescription,
            expertType,
            fileUrls
          },
          opinion_output: sections,
          file_urls: fileUrls || []
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
        causeAnalysis: sections.causeAnalysis || opinionText,
        severityAssessment: sections.severityAssessment || '',
        documentationRequirements: sections.documentationRequirements || '',
        recommendations: sections.recommendations || ''
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

function parseOpinionSections(text) {
  const sections = {
    causeAnalysis: '',
    severityAssessment: '',
    documentationRequirements: '',
    recommendations: ''
  };

  // Try to extract sections by headings
  const causeMatch = text.match(/Cause Analysis:?\s*([\s\S]*?)(?=Severity Assessment|Documentation Requirements|Recommendations|$)/i);
  if (causeMatch) {
    sections.causeAnalysis = causeMatch[1].trim();
  }

  const severityMatch = text.match(/Severity Assessment:?\s*([\s\S]*?)(?=Documentation Requirements|Recommendations|$)/i);
  if (severityMatch) {
    sections.severityAssessment = severityMatch[1].trim();
  }

  const docMatch = text.match(/Documentation Requirements:?\s*([\s\S]*?)(?=Recommendations|$)/i);
  if (docMatch) {
    sections.documentationRequirements = docMatch[1].trim();
  }

  const recMatch = text.match(/Recommendations:?\s*([\s\S]*?)$/i);
  if (recMatch) {
    sections.recommendations = recMatch[1].trim();
  }

  // If no sections found, return full text in causeAnalysis
  if (!sections.causeAnalysis && !sections.severityAssessment) {
    sections.causeAnalysis = text;
  }

  return sections;
}


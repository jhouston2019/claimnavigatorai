/**
 * Contractor Estimate Interpreter
 * Analyzes contractor estimates, extracts line items, identifies missing scope, and compares against ROM ranges
 */

const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Download file from URL
 */
async function downloadFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(buffer, fileName) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const base64Image = buffer.toString('base64');
    const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this contractor estimate. Return only the raw text content, preserving line breaks and structure. Do not add any commentary or analysis.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Parse line items from extracted text using AI
 */
async function parseLineItemsWithAI(extractedText, lossType, severity, areas) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert at parsing contractor estimates. Extract all line items from the estimate text and return a structured JSON array.

For each line item, identify:
- description: Clear description of the work/item
- quantity: Numeric quantity (if present)
- unit: Unit of measure (SF, LF, EA, etc.)
- unitPrice: Price per unit (if present)
- lineTotal: Total for this line item
- category: Category (interior, exterior, roofing, plumbing, electrical, hvac, mitigation, other)

Flag items that:
- Have "possible_underpricing" if the unit price seems unusually low
- Have "missing_quantity" if quantity is missing but should be present
- Have "ambiguous_description" if the description is unclear

Also identify:
- totalAmount: Total estimate amount
- Any missing scope items commonly needed for this loss type

Return JSON in this format:
{
  "lineItems": [...],
  "totalAmount": 84250,
  "missingScope": ["item 1", "item 2"],
  "coverageCategory": "dwelling" or "contents" or "ale" or "mixed"
}`;

    const userPrompt = `Extract line items from this contractor estimate:

Loss Type: ${lossType || 'Unknown'}
Severity: ${severity || 'Unknown'}
Areas Affected: ${areas?.join(', ') || 'Unknown'}

Estimate Text:
${extractedText.substring(0, 8000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error('Failed to parse estimate with AI');
  }
}

/**
 * Get ROM range estimate
 */
async function getROMRange(lossType, severity, areas) {
  try {
    // Map loss type to ROM category
    const categoryMap = {
      'Fire': 'fire',
      'Water': 'water',
      'Wind': 'wind',
      'Hail': 'roof',
      'Hurricane': 'structural',
      'Mold': 'water',
      'Theft': 'contents',
      'Vandalism': 'structural'
    };

    const category = categoryMap[lossType] || 'structural';
    const severityMap = {
      'Low': 'minor',
      'Moderate': 'moderate',
      'Severe': 'severe',
      'Catastrophic': 'total_loss'
    };
    const romSeverity = severityMap[severity] || 'moderate';

    // Estimate square footage based on areas (rough approximation)
    let estimatedSqft = 1000; // Default
    if (areas && areas.length > 0) {
      // Rough estimate: 200 sqft per area
      estimatedSqft = areas.length * 200;
    }

    // Call ROM estimator
    const romResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/ai-rom-estimator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        category: category,
        severity: romSeverity,
        square_feet: estimatedSqft
      })
    });

    if (romResponse.ok) {
      const romData = await romResponse.json();
      const estimate = romData.estimate || romData.low || 0;
      
      // Create range (low = 0.9x, high = 1.2x of estimate)
      return {
        low: Math.round(estimate * 0.9),
        high: Math.round(estimate * 1.2)
      };
    }
  } catch (error) {
    console.warn('ROM estimator call failed:', error);
  }

  // Fallback: return null (will be handled in comparison)
  return null;
}

/**
 * Compare estimate to ROM range
 */
function compareToROMRange(totalAmount, romRange) {
  if (!romRange || !romRange.low || !romRange.high) {
    return { relation: 'unknown' };
  }

  if (totalAmount < romRange.low) {
    return { ...romRange, relation: 'below-range' };
  } else if (totalAmount > romRange.high) {
    return { ...romRange, relation: 'above-range' };
  } else {
    return { ...romRange, relation: 'within-range' };
  }
}

/**
 * Generate recommendations
 */
async function generateRecommendations(parsedData, lossType, severity, areas) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return [];
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Based on this contractor estimate analysis:

Loss Type: ${lossType || 'Unknown'}
Severity: ${severity || 'Unknown'}
Total: $${parsedData.totalAmount || 0}
Missing Scope Items: ${(parsedData.missingScope || []).join(', ') || 'None identified'}
ROM Relation: ${parsedData.romRange?.relation || 'unknown'}

Provide 3-5 plain-language recommendations as a JSON array:
- Questions to ask the contractor
- Documents/photos to add
- Whether to discuss with adjuster
- Any other actionable advice

Return only a JSON array of strings: ["recommendation 1", "recommendation 2", ...]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.recommendations || parsed.array || [];
  } catch (error) {
    console.warn('Recommendations generation failed:', error);
    return [
      'Review the estimate line items for accuracy.',
      'Ask the contractor to clarify any ambiguous descriptions.',
      'Compare this estimate with your carrier\'s estimate when available.'
    ];
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
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
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    const supabase = getSupabaseClient();
    
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch (err) {
        console.warn('Auth check failed:', err.message);
      }
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileUrl, fileName, lossType, severity, areas, claimId } = body;

    if (!fileUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'fileUrl is required' })
      };
    }

    // Download file
    const fileBuffer = await downloadFile(fileUrl);
    
    // Extract text
    let extractedText = '';
    if (fileName.endsWith('.pdf')) {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (fileName.match(/\.(png|jpg|jpeg)$/i)) {
      extractedText = await extractTextFromImage(fileBuffer, fileName);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unsupported file type. Please use PDF or image.' })
      };
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Could not extract sufficient text from file. Please ensure the estimate is readable.' })
      };
    }

    // Parse line items with AI
    const parsedData = await parseLineItemsWithAI(extractedText, lossType, severity, areas);

    // Get ROM range
    const romRange = await getROMRange(lossType, severity, areas);
    const romComparison = compareToROMRange(parsedData.totalAmount || 0, romRange);

    // Generate recommendations
    const recommendations = await generateRecommendations(
      { ...parsedData, romRange: romComparison },
      lossType,
      severity,
      areas
    );

    // Build response
    const response = {
      summary: {
        totalAmount: parsedData.totalAmount || 0,
        lineItemCount: (parsedData.lineItems || []).length,
        coverageCategory: parsedData.coverageCategory || 'mixed',
        romRange: romComparison
      },
      lineItems: parsedData.lineItems || [],
      missingScope: parsedData.missingScope || [],
      recommendations: recommendations
    };

    // Store interpretation in database (optional)
    if (supabase && userId && claimId) {
      try {
        await supabase.from('contractor_estimate_interpretations').insert({
          user_id: userId,
          claim_id: claimId,
          estimate_total: response.summary.totalAmount,
          rom_low: romComparison.low,
          rom_high: romComparison.high,
          rom_relation: romComparison.relation,
          loss_type: lossType,
          severity: severity,
          areas: areas || [],
          line_items: response.lineItems,
          missing_scope: response.missingScope,
          recommendations: response.recommendations,
          created_at: new Date().toISOString()
        }).catch(() => {
          // Table might not exist, that's okay
          console.warn('contractor_estimate_interpretations table not found, skipping database storage');
        });
      } catch (error) {
        console.warn('Failed to store interpretation:', error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Contractor estimate interpreter error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to interpret estimate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};



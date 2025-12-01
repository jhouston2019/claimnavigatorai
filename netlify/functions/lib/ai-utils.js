/**
 * Shared AI Utilities
 * Common functions for all AI Netlify Functions
 */

const OpenAI = require('openai');

/**
 * Initialize OpenAI client
 */
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Run OpenAI completion
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {object} options - Additional options (model, temperature, etc.)
 */
async function runOpenAI(systemPrompt, userPrompt, options = {}) {
  const openai = getOpenAIClient();
  
  const {
    model = 'gpt-4o',
    temperature = 0.7,
    max_tokens = 2000,
    response_format = null
  } = options;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const params = {
    model,
    messages,
    temperature,
    max_tokens
  };

  if (response_format) {
    params.response_format = response_format;
  }

  const completion = await openai.chat.completions.create(params);
  
  return completion.choices[0].message.content;
}

/**
 * Sanitize input text
 */
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Remove potentially harmful content
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .substring(0, 50000); // Limit length
}

/**
 * Extract text from PDF buffer (placeholder - requires pdf-parse)
 * This would be called from text-extract.js
 */
async function extractTextFromPDF(buffer) {
  // This is a placeholder
  // Actual implementation would use pdf-parse library
  throw new Error('PDF extraction not implemented in utils - use text-extract function');
}

/**
 * Validate required fields
 */
function validateRequired(data, fields) {
  const missing = fields.filter(field => !data[field] || (typeof data[field] === 'string' && !data[field].trim()));
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

module.exports = {
  getOpenAIClient,
  runOpenAI,
  sanitizeInput,
  validateRequired
};




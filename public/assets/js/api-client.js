// API client utilities for Claim Navigator Resource Center
// Provides centralized API communication functions

/**
 * Base API configuration
 */
const API_CONFIG = {
  baseUrl: '/.netlify/functions',
  timeout: 30000,
  retries: 3
};

/**
 * Makes a POST request with JSON body
 * @param {string} url - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise} - API response
 */
export async function postJSON(url, body) {
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseUrl}/${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Calls AI with prompt and metadata
 * @param {string} prompt - AI prompt
 * @param {Object} meta - Additional metadata
 * @returns {Promise} - AI response
 */
export async function callAI(prompt, meta = {}) {
  return postJSON('generate-response', {
    letter: prompt,
    type: meta.type || 'general',
    ...meta
  });
}

/**
 * Gets signed URL for protected downloads
 * @param {string} path - File path
 * @returns {Promise} - Signed URL
 */
export async function getSignedUrl(path) {
  return postJSON('generate-signed-url', { path });
}

/**
 * Creates document with AI
 * @param {Object} payload - Document creation payload
 * @returns {Promise} - Created document
 */
export async function createDoc(payload) {
  return postJSON('generate-document-simple', payload);
}

/**
 * Lists documents by language and type
 * @param {string} lang - Language code
 * @param {string} type - Document type
 * @returns {Promise} - Document list
 */
export async function listDocs(lang = 'en', type = 'claim_documents') {
  return postJSON('list-documents-simple', { lang, type });
}

/**
 * Analyzes policy text
 * @param {string} text - Policy text to analyze
 * @returns {Promise} - Analysis result
 */
export async function analyzePolicyText(text) {
  return postJSON('policyAnalyzer', { text });
}

/**
 * Analyzes claim data
 * @param {Object} body - Claim analysis data
 * @returns {Promise} - Analysis result
 */
export async function analyzeClaim(body) {
  return postJSON('analyze-claim', body);
}

/**
 * Creates Stripe checkout session
 * @param {string} priceId - Stripe price ID
 * @param {Object} meta - Additional metadata
 * @returns {Promise} - Checkout session
 */
export async function createCheckoutSession(priceId, meta = {}) {
  return postJSON('create-checkout-session', {
    priceId,
    ...meta
  });
}

/**
 * Generates AI response with specific type
 * @param {string} type - Response type
 * @param {Object} data - Input data
 * @returns {Promise} - AI response
 */
export async function generateResponse(type, data) {
  return postJSON('generate-response', {
    type,
    ...data
  });
}

/**
 * Tracks claim timeline
 * @param {Object} data - Timeline data
 * @returns {Promise} - Tracking result
 */
export async function trackTimeline(data) {
  return postJSON('claim-timeline-tracker', data);
}

/**
 * Tracks deadlines
 * @param {Object} data - Deadline data
 * @returns {Promise} - Tracking result
 */
export async function trackDeadlines(data) {
  return postJSON('deadline-tracker', data);
}

/**
 * Calculates financial impact
 * @param {Object} data - Calculation data
 * @returns {Promise} - Calculation result
 */
export async function calculateFinancialImpact(data) {
  return postJSON('financial-impact-calculator', data);
}

/**
 * Compares settlements
 * @param {Object} data - Settlement data
 * @returns {Promise} - Comparison result
 */
export async function compareSettlements(data) {
  return postJSON('settlement-comparison', data);
}

/**
 * Gets professional marketplace data
 * @param {Object} filters - Filter options
 * @returns {Promise} - Marketplace data
 */
export async function getMarketplace(filters = {}) {
  return postJSON('professional-marketplace', filters);
}

/**
 * Uploads file to storage
 * @param {File} file - File to upload
 * @param {string} type - File type
 * @returns {Promise} - Upload result
 */
export async function uploadFile(file, type = 'document') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await fetch(`${API_CONFIG.baseUrl}/upload-file`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Downloads file by ID
 * @param {string} fileId - File ID
 * @returns {Promise} - Download URL
 */
export async function downloadFile(fileId) {
  return postJSON(`download/${fileId}`);
}

/**
 * Gets user credits
 * @returns {Promise} - User credits
 */
export async function getUserCredits() {
  return postJSON('get-user-credits');
}

/**
 * Saves draft content
 * @param {Object} data - Draft data
 * @returns {Promise} - Save result
 */
export async function saveDraft(data) {
  return postJSON('save-draft', data);
}

/**
 * Gets Supabase configuration
 * @returns {Promise} - Supabase config
 */
export async function getSupabaseConfig() {
  return postJSON('get-supabase-config');
}

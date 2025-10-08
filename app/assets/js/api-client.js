// API client utilities for ClaimNavigatorAI
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
 * Makes an API request with error handling and retries
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise} - API response
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.baseUrl}/${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: API_CONFIG.timeout
  };
  
  const requestOptions = { ...defaultOptions, ...options };
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generates AI response
 * @param {Object} data - Request data
 * @returns {Promise} - AI response
 */
async function generateAiResponse(data) {
  return apiRequest('generate-response', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Generates document
 * @param {Object} data - Document data
 * @returns {Promise} - Generated document
 */
async function generateDocument(data) {
  return apiRequest('document-generator-integration', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Analyzes claim
 * @param {Object} data - Claim data
 * @returns {Promise} - Analysis result
 */
async function analyzeClaim(data) {
  return apiRequest('analyze-claim', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Gets user credits
 * @returns {Promise} - User credits data
 */
async function getUserCredits() {
  return apiRequest('get-user-credits');
}

/**
 * Saves draft content
 * @param {Object} data - Draft data
 * @returns {Promise} - Save result
 */
async function saveDraft(data) {
  return apiRequest('save-draft', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Gets Supabase configuration
 * @returns {Promise} - Supabase config
 */
async function getSupabaseConfig() {
  return apiRequest('get-supabase-config');
}

/**
 * Processes Stripe checkout
 * @param {Object} data - Checkout data
 * @returns {Promise} - Checkout result
 */
async function processCheckout(data) {
  return apiRequest('checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Gets professional marketplace data
 * @param {Object} filters - Filter options
 * @returns {Promise} - Marketplace data
 */
async function getProfessionalMarketplace(filters = {}) {
  return apiRequest('professional-marketplace', {
    method: 'POST',
    body: JSON.stringify(filters)
  });
}

/**
 * Calculates financial impact
 * @param {Object} data - Calculation data
 * @returns {Promise} - Calculation result
 */
async function calculateFinancialImpact(data) {
  return apiRequest('financial-impact-calculator', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Tracks claim stage
 * @param {Object} data - Stage data
 * @returns {Promise} - Tracking result
 */
async function trackClaimStage(data) {
  return apiRequest('claim-stage-tracker', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Tracks claim timeline
 * @param {Object} data - Timeline data
 * @returns {Promise} - Tracking result
 */
async function trackClaimTimeline(data) {
  return apiRequest('claim-timeline-tracker', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Tracks deadlines
 * @param {Object} data - Deadline data
 * @returns {Promise} - Tracking result
 */
async function trackDeadlines(data) {
  return apiRequest('deadline-tracker', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Compares settlements
 * @param {Object} data - Settlement data
 * @returns {Promise} - Comparison result
 */
async function compareSettlements(data) {
  return apiRequest('settlement-comparison', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Gets AI advisory
 * @param {Object} data - Advisory data
 * @returns {Promise} - Advisory result
 */
async function getAiAdvisory(data) {
  return apiRequest('ai-advisory-system', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Gets documentation checklist
 * @param {Object} data - Checklist data
 * @returns {Promise} - Checklist result
 */
async function getDocumentationChecklist(data) {
  return apiRequest('documentation-checklist', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Analyzes policy
 * @param {Object} data - Policy data
 * @returns {Promise} - Analysis result
 */
async function analyzePolicy(data) {
  return apiRequest('policyAnalyzer', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Handles file upload
 * @param {File} file - File to upload
 * @param {string} type - File type
 * @returns {Promise} - Upload result
 */
async function uploadFile(file, type = 'document') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  return apiRequest('upload-file', {
    method: 'POST',
    body: formData,
    headers: {} // Let browser set Content-Type for FormData
  });
}

/**
 * Downloads file
 * @param {string} fileId - File ID
 * @returns {Promise} - Download URL
 */
async function downloadFile(fileId) {
  return apiRequest(`download-file/${fileId}`);
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    apiRequest,
    generateAiResponse,
    generateDocument,
    analyzeClaim,
    getUserCredits,
    saveDraft,
    getSupabaseConfig,
    processCheckout,
    getProfessionalMarketplace,
    calculateFinancialImpact,
    trackClaimStage,
    trackClaimTimeline,
    trackDeadlines,
    compareSettlements,
    getAiAdvisory,
    getDocumentationChecklist,
    analyzePolicy,
    uploadFile,
    downloadFile
  };
}

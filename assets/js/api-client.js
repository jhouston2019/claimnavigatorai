// Enhanced API client with caching, rate limiting, and offline support
class ApiClient {
  constructor() {
    this.cache = new CacheManager(50, 300000); // 5 minutes cache
    this.rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
    this.offlineManager = new OfflineManager();
    this.baseUrl = window.location.origin;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Check cache first
    if (options.method === 'GET' && !options.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check rate limit
    const userIdentifier = this.getUserIdentifier();
    if (!this.rateLimiter.isAllowed(userIdentifier)) {
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(60000 / 1000)} seconds before trying again.`);
    }

    try {
      const response = await this.offlineManager.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(options.body || {}),
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      if (options.method === 'GET' && data.success) {
        this.cache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      // Handle different types of errors
      const errorInfo = window.errorHandler.handleApiError(error, { endpoint, options });
      
      if (errorInfo.shouldRetry) {
        // Retry with exponential backoff
        return await this.retryRequest(endpoint, options, 3);
      }
      
      if (errorInfo.shouldFallback) {
        return this.getFallbackResponse(endpoint, options);
      }
      
      throw error;
    }
  }

  async retryRequest(endpoint, options, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return await this.makeRequest(endpoint, { ...options, forceRefresh: true });
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
  }

  getFallbackResponse(endpoint, options) {
    // Provide fallback responses for critical endpoints
    const fallbacks = {
      '/.netlify/functions/ai-advisory-system': {
        success: true,
        questions: [{
          id: 'fallback-question',
          step: 1,
          question: 'What type of insurance claim are you dealing with?',
          type: 'single-choice',
          options: [
            { value: 'property', label: 'Property (Home, Business, Rental)', icon: '🏠' },
            { value: 'auto', label: 'Auto (Vehicle, Motorcycle, Commercial)', icon: '🚗' },
            { value: 'health', label: 'Health Insurance', icon: '🏥' }
          ],
          required: true,
          helpText: 'This helps us provide the most relevant advice for your specific situation.'
        }],
        currentStep: 1,
        totalSteps: 10,
        progress: 10
      },
      '/.netlify/functions/document-generator-integration': {
        success: true,
        suggestions: {
          primary: [{
            type: 'appeal-letter',
            title: 'Appeal Letter',
            description: 'Professional appeal letter addressing denial reasons',
            priority: 'critical',
            timeline: 'Immediately',
            autoPopulate: true,
            requiredFields: ['denialReasons', 'supportingEvidence', 'policyReferences']
          }],
          secondary: [{
            type: 'proof-of-loss',
            title: 'Proof of Loss Statement',
            description: 'Sworn statement of damages with supporting documentation',
            priority: 'high',
            timeline: 'Within 3 days',
            autoPopulate: true,
            requiredFields: ['damageDescription', 'itemizedLosses', 'supportingEvidence']
          }]
        }
      }
    };

    return fallbacks[endpoint] || {
      success: false,
      error: 'Service temporarily unavailable. Please try again later.',
      fallback: true
    };
  }

  getCacheKey(endpoint, options) {
    return `${endpoint}_${JSON.stringify(options.body || {})}`;
  }

  getUserIdentifier() {
    // Use a combination of user agent and session storage
    const sessionId = sessionStorage.getItem('sessionId') || this.generateSessionId();
    sessionStorage.setItem('sessionId', sessionId);
    return `${navigator.userAgent}_${sessionId}`;
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Specific API methods
  async getAdvisoryQuestions(step, responses) {
    return await this.makeRequest('/.netlify/functions/ai-advisory-system', {
      body: {
        action: 'get-questions',
        currentStep: step,
        userResponses: responses
      }
    });
  }

  async analyzeAdvisoryResponses(responses) {
    return await this.makeRequest('/.netlify/functions/ai-advisory-system', {
      body: {
        action: 'analyze-responses',
        userResponses: responses
      }
    });
  }

  async getAdvisoryRecommendations(situationType, responses) {
    return await this.makeRequest('/.netlify/functions/ai-advisory-system', {
      body: {
        action: 'get-advisory',
        situationType: situationType,
        userResponses: responses
      }
    });
  }

  async getSuggestedDocuments(situationType, responses) {
    return await this.makeRequest('/.netlify/functions/document-generator-integration', {
      body: {
        action: 'get-suggested-documents',
        situationType: situationType,
        userResponses: responses
      }
    });
  }

  async getDocumentSequence(situationType, responses) {
    return await this.makeRequest('/.netlify/functions/document-generator-integration', {
      body: {
        action: 'get-document-sequence',
        situationType: situationType,
        userResponses: responses
      }
    });
  }

  async prePopulateTemplate(documentType, responses, templateData) {
    return await this.makeRequest('/.netlify/functions/document-generator-integration', {
      body: {
        action: 'pre-populate-template',
        documentType: documentType,
        userResponses: responses,
        templateData: templateData
      }
    });
  }

  async validateDocumentData(documentType, templateData) {
    return await this.makeRequest('/.netlify/functions/document-generator-integration', {
      body: {
        action: 'validate-document-data',
        documentType: documentType,
        templateData: templateData
      }
    });
  }

  // Utility methods
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.cache.size,
      maxSize: this.cache.maxSize,
      ttl: this.cache.ttl
    };
  }

  getRateLimitInfo() {
    const userIdentifier = this.getUserIdentifier();
    return {
      remaining: this.rateLimiter.getRemainingRequests(userIdentifier),
      maxRequests: this.rateLimiter.maxRequests,
      timeWindow: this.rateLimiter.timeWindow
    };
  }
}

// Export API client
window.ApiClient = ApiClient;
window.apiClient = new ApiClient();

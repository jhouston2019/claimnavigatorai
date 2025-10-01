// Enhanced validation utilities for robust data handling
class ValidationUtils {
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .substring(0, 10000); // Limit length
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static validateRequired(field, value) {
    if (!value || value.trim() === '') {
      return { isValid: false, error: `${field} is required` };
    }
    return { isValid: true };
  }

  static validateLength(field, value, minLength = 1, maxLength = 1000) {
    if (value.length < minLength) {
      return { isValid: false, error: `${field} must be at least ${minLength} characters` };
    }
    if (value.length > maxLength) {
      return { isValid: false, error: `${field} must be no more than ${maxLength} characters` };
    }
    return { isValid: true };
  }

  static validateNumeric(field, value) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: `${field} must be a valid number` };
    }
    if (num < 0) {
      return { isValid: false, error: `${field} must be positive` };
    }
    return { isValid: true, value: num };
  }

  static validateDate(field, value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: `${field} must be a valid date` };
    }
    if (date > new Date()) {
      return { isValid: false, error: `${field} cannot be in the future` };
    }
    return { isValid: true, value: date };
  }

  static validateAdvisoryResponse(step, response) {
    const validations = {
      1: { required: true, type: 'single-choice' },
      2: { required: true, type: 'single-choice' },
      3: { required: true, type: 'single-choice' },
      4: { required: true, type: 'single-choice' },
      5: { required: true, type: 'multi-choice' },
      6: { required: true, type: 'single-choice' },
      7: { required: true, type: 'multi-choice' },
      8: { required: true, type: 'single-choice' },
      9: { required: true, type: 'multi-choice' },
      10: { required: true, type: 'single-choice' }
    };

    const validation = validations[step];
    if (!validation) {
      return { isValid: false, error: 'Invalid step number' };
    }

    if (validation.required && (!response || response.length === 0)) {
      return { isValid: false, error: 'Response is required for this step' };
    }

    return { isValid: true };
  }

  static validateDocumentData(documentType, data) {
    const rules = {
      'appeal-letter': {
        required: ['recipient', 'subject', 'body'],
        maxLength: { body: 5000, subject: 200 },
        email: ['recipient']
      },
      'proof-of-loss': {
        required: ['claimNumber', 'policyNumber', 'lossDate', 'damageDescription'],
        maxLength: { damageDescription: 2000 },
        numeric: ['claimNumber', 'policyNumber']
      },
      'settlement-comparison': {
        required: ['insurerOffer', 'actualDamages'],
        numeric: ['insurerOffer', 'actualDamages']
      }
    };

    const rule = rules[documentType];
    if (!rule) {
      return { isValid: false, error: 'Unknown document type' };
    }

    const errors = [];

    // Check required fields
    rule.required.forEach(field => {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    // Check field lengths
    if (rule.maxLength) {
      Object.entries(rule.maxLength).forEach(([field, maxLength]) => {
        if (data[field] && data[field].length > maxLength) {
          errors.push(`${field} exceeds maximum length of ${maxLength} characters`);
        }
      });
    }

    // Check numeric fields
    if (rule.numeric) {
      rule.numeric.forEach(field => {
        if (data[field] && isNaN(parseFloat(data[field]))) {
          errors.push(`${field} must be a valid number`);
        }
      });
    }

    // Check email fields
    if (rule.email) {
      rule.email.forEach(field => {
        if (data[field] && !this.validateEmail(data[field])) {
          errors.push(`${field} must be a valid email address`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Rate limiting utility
class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) { // 10 requests per minute
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Caching utility
class CacheManager {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value: value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Offline support utility
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingRequests = [];
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingRequests();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async makeRequest(url, options) {
    if (this.isOnline) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        // Network error, queue for retry
        this.pendingRequests.push({ url, options });
        throw error;
      }
    } else {
      // Offline, queue for later
      this.pendingRequests.push({ url, options });
      throw new Error('Offline - request queued for retry');
    }
  }

  async processPendingRequests() {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    
    for (const request of requests) {
      try {
        await fetch(request.url, request.options);
      } catch (error) {
        // Re-queue failed requests
        this.pendingRequests.push(request);
      }
    }
  }
}

// Export utilities
window.ValidationUtils = ValidationUtils;
window.RateLimiter = RateLimiter;
window.CacheManager = CacheManager;
window.OfflineManager = OfflineManager;

// Enhanced error handling and recovery system
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxErrors = 100;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLog.push(errorEntry);
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxErrors) {
      this.errorLog.shift();
    }

    // Log to console for debugging
    console.error('Error logged:', errorEntry);
    
    // Send to error tracking service (if available)
    this.sendToErrorService(errorEntry);
  }

  async sendToErrorService(errorEntry) {
    try {
      // Only send if we have a tracking service configured
      if (window.SENTRY_DSN) {
        await fetch('/.netlify/functions/error-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorEntry)
        });
      }
    } catch (error) {
      console.error('Failed to send error to tracking service:', error);
    }
  }

  async retryOperation(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logError(error, { ...context, attempt, maxAttempts: this.retryAttempts });
        
        if (attempt < this.retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  handleApiError(error, context = {}) {
    this.logError(error, context);
    
    // Determine user-friendly message
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.status === 401) {
      userMessage = 'Authentication required. Please log in again.';
    } else if (error.status === 403) {
      userMessage = 'Access denied. You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userMessage = 'The requested resource was not found.';
    } else if (error.status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    }
    
    return {
      userMessage,
      shouldRetry: error.status >= 500 || error.message.includes('NetworkError'),
      shouldFallback: true
    };
  }

  showErrorToUser(message, options = {}) {
    const errorContainer = document.getElementById('error-container') || this.createErrorContainer();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.cssText = `
      background: #fef2f2;
      border: 1px solid #dc2626;
      color: #dc2626;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    
    errorElement.innerHTML = `
      <span style="font-size: 1.2rem;">⚠️</span>
      <div>
        <strong>Error:</strong> ${message}
        ${options.retry ? '<button onclick="this.parentElement.parentElement.remove()" style="margin-left: 1rem; background: #dc2626; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer;">Dismiss</button>' : ''}
      </div>
    `;
    
    errorContainer.appendChild(errorElement);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorElement.parentElement) {
        errorElement.remove();
      }
    }, 10000);
  }

  createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
  }

  showSuccessMessage(message) {
    const successContainer = document.getElementById('success-container') || this.createSuccessContainer();
    
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.style.cssText = `
      background: #f0fdf4;
      border: 1px solid #22c55e;
      color: #15803d;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    
    successElement.innerHTML = `
      <span style="font-size: 1.2rem;">✅</span>
      <div>
        <strong>Success:</strong> ${message}
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 1rem; background: #22c55e; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer;">Dismiss</button>
      </div>
    `;
    
    successContainer.appendChild(successElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (successElement.parentElement) {
        successElement.remove();
      }
    }, 5000);
  }

  createSuccessContainer() {
    const container = document.createElement('div');
    container.id = 'success-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  const errorHandler = window.errorHandler || new ErrorHandler();
  errorHandler.logError(event.error, {
    type: 'javascript',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const errorHandler = window.errorHandler || new ErrorHandler();
  errorHandler.logError(event.reason, {
    type: 'promise',
    promise: event.promise
  });
});

// Export error handler
window.ErrorHandler = ErrorHandler;
window.errorHandler = new ErrorHandler();

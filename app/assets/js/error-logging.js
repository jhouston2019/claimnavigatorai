/**
 * Global Error Logging System
 * Mega Build A - Client-side error capture and reporting
 */

(function() {
  // Global error handler
  window.onerror = function(message, source, lineno, colno, error) {
    const errorInfo = {
      message: message,
      source: source,
      line: lineno,
      column: colno,
      error: error ? error.toString() : null,
      stack: error ? error.stack : null,
      timestamp: new Date().toISOString()
    };

    console.error('CNError:', errorInfo);

    // Show user-friendly toast
    if (window.CNToast) {
      window.CNToast.error('An unexpected error occurred. Please try again.');
    }

    // Store error in localStorage for debugging (last 10 errors)
    try {
      const errors = JSON.parse(localStorage.getItem('cn_error_log') || '[]');
      errors.push(errorInfo);
      if (errors.length > 10) {
        errors.shift();
      }
      localStorage.setItem('cn_error_log', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to log error to localStorage:', e);
    }

    return false; // Don't prevent default error handling
  };

  // Promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    const errorInfo = {
      message: event.reason?.message || 'Unhandled Promise Rejection',
      reason: event.reason,
      timestamp: new Date().toISOString()
    };

    console.error('CNError (Promise):', errorInfo);

    if (window.CNToast) {
      window.CNToast.error('An error occurred. Please try again.');
    }

    // Store error
    try {
      const errors = JSON.parse(localStorage.getItem('cn_error_log') || '[]');
      errors.push(errorInfo);
      if (errors.length > 10) {
        errors.shift();
      }
      localStorage.setItem('cn_error_log', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to log error to localStorage:', e);
    }
  });

  // Safe wrapper for async functions
  window.CNSafe = {
    wrap: function(fn, errorMessage = 'An error occurred') {
      return async function(...args) {
        try {
          return await fn.apply(this, args);
        } catch (error) {
          console.error('CNError (Wrapped):', error);
          if (window.CNToast) {
            window.CNToast.error(errorMessage);
          }
          throw error;
        }
      };
    }
  };
})();


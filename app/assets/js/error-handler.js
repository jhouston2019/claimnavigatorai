// Error handling utilities for ClaimNavigatorAI
// Provides centralized error handling and user feedback

/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
  showErrorNotification('An unexpected error occurred. Please try again.');
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  showErrorNotification('A network error occurred. Please check your connection.');
});

/**
 * Shows error notification to user
 * @param {string} message - Error message to display
 * @param {string} type - Type of error (error, warning, info)
 */
function showErrorNotification(message, type = 'error') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.error-notification');
  existingNotifications.forEach(notification => notification.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Set background color based on type
  switch (type) {
    case 'error':
      notification.style.backgroundColor = '#dc2626';
      break;
    case 'warning':
      notification.style.backgroundColor = '#f59e0b';
      break;
    case 'info':
      notification.style.backgroundColor = '#3b82f6';
      break;
    default:
      notification.style.backgroundColor = '#6b7280';
  }
  
  notification.textContent = message;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    margin-left: 1rem;
    padding: 0;
    line-height: 1;
  `;
  closeButton.onclick = () => notification.remove();
  
  notification.appendChild(closeButton);
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

/**
 * Shows success notification to user
 * @param {string} message - Success message to display
 */
function showSuccessNotification(message) {
  showErrorNotification(message, 'info');
}

/**
 * Handles API errors
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
function handleApiError(error, context = 'API call') {
  console.error(`${context} error:`, error);
  
  let userMessage = 'An error occurred. Please try again.';
  
  if (error.message) {
    if (error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.message.includes('401')) {
      userMessage = 'Authentication required. Please log in.';
    } else if (error.message.includes('403')) {
      userMessage = 'Access denied. Please check your permissions.';
    } else if (error.message.includes('404')) {
      userMessage = 'Resource not found. Please try again.';
    } else if (error.message.includes('500')) {
      userMessage = 'Server error. Please try again later.';
    }
  }
  
  showErrorNotification(userMessage);
}

/**
 * Handles form validation errors
 * @param {Object} errors - Validation errors object
 */
function handleValidationErrors(errors) {
  for (const field in errors) {
    const element = document.getElementById(field);
    if (element) {
      showValidationError(field, errors[field]);
    }
  }
}

/**
 * Logs error for debugging
 * @param {string} message - Error message
 * @param {Object} data - Additional error data
 */
function logError(message, data = {}) {
  console.error(`[ClaimNavigatorAI Error] ${message}`, data);
  
  // In production, you might want to send this to an error tracking service
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Send to error tracking service (e.g., Sentry, LogRocket, etc.)
    // trackError(message, data);
  }
}

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showErrorNotification,
    showSuccessNotification,
    handleApiError,
    handleValidationErrors,
    logError,
    retryWithBackoff
  };
}

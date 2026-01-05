// UI helper utilities for Claim Navigator Resource Center
// Provides common UI interaction functions

/**
 * Adds event listener to element
 * @param {Element|string} el - Element or selector
 * @param {string} ev - Event name
 * @param {Function} fn - Event handler
 */
export function on(el, ev, fn) {
  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (element) {
    element.addEventListener(ev, fn);
  }
}

/**
 * Query selector helper
 * @param {string} selector - CSS selector
 * @returns {Element|null} - Found element
 */
export function qs(selector) {
  return document.querySelector(selector);
}

/**
 * Query selector all helper
 * @param {string} selector - CSS selector
 * @returns {NodeList} - Found elements
 */
export function qsa(selector) {
  return document.querySelectorAll(selector);
}

/**
 * Toggles element visibility
 * @param {string} id - Element ID
 */
export function toggle(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Sets innerHTML of element
 * @param {string} id - Element ID
 * @param {string} html - HTML content
 */
export function setHTML(id, html) {
  const element = document.getElementById(id);
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Shows toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, info)
 */
export function toast(message, type = 'info') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.style.cssText = `
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
    case 'success':
      toastEl.style.backgroundColor = '#10b981';
      break;
    case 'error':
      toastEl.style.backgroundColor = '#ef4444';
      break;
    case 'warning':
      toastEl.style.backgroundColor = '#f59e0b';
      break;
    default:
      toastEl.style.backgroundColor = '#3b82f6';
  }
  
  toastEl.textContent = message;
  document.body.appendChild(toastEl);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.remove();
    }
  }, 5000);
}

/**
 * Shows loading state on element
 * @param {string} elementId - Element ID
 * @param {boolean} isLoading - Loading state
 */
export function setLoadingState(elementId, isLoading) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (isLoading) {
    element.disabled = true;
    element.innerHTML = '<span class="loading-spinner"></span> Loading...';
    element.classList.add('loading');
  } else {
    element.disabled = false;
    element.classList.remove('loading');
    // Restore original text if stored
    const originalText = element.getAttribute('data-original-text');
    if (originalText) {
      element.innerHTML = originalText;
    }
  }
}

/**
 * Stores original text of element
 * @param {string} elementId - Element ID
 */
export function storeOriginalText(elementId) {
  const element = document.getElementById(elementId);
  if (element && !element.getAttribute('data-original-text')) {
    element.setAttribute('data-original-text', element.innerHTML);
  }
}

/**
 * Scrolls to element smoothly
 * @param {string} elementId - Element ID
 * @param {number} offset - Offset from top
 */
export function scrollToElement(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const elementPosition = element.offsetTop - offset;
  window.scrollTo({
    top: elementPosition,
    behavior: 'smooth'
  });
}

/**
 * Formats currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formats date
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
}

/**
 * Debounces function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Toggles phase section (for timeline)
 * @param {string} id - Phase ID
 */
export function togglePhase(id) {
  const phase = document.getElementById(id);
  if (!phase) return;
  
  const content = phase.querySelector('.phase-content');
  const toggle = phase.querySelector('.phase-toggle');
  
  if (!content || !toggle) return;
  
  const isExpanded = content.style.display !== 'none';
  
  if (isExpanded) {
    content.style.display = 'none';
    toggle.textContent = '+';
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    content.style.display = 'block';
    toggle.textContent = '-';
    toggle.setAttribute('aria-expanded', 'true');
  }
}

/**
 * Toggles section with animation
 * @param {string} id - Section ID
 */
export function toggleSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  
  const content = section.querySelector('.section-content');
  const toggle = section.querySelector('.section-toggle');
  
  if (!content || !toggle) return;
  
  const isExpanded = !content.classList.contains('hidden');
  
  if (isExpanded) {
    content.classList.add('hidden');
    toggle.textContent = '+';
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    content.classList.remove('hidden');
    toggle.textContent = '-';
    toggle.setAttribute('aria-expanded', 'true');
  }
}

// Add CSS for animations
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
  
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .hidden {
    display: none;
  }
`;
document.head.appendChild(style);
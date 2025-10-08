// Validation utilities for ClaimNavigatorAI
// Provides form validation and data validation functions

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
function validatePhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validates required field
 * @param {string} value - Value to validate
 * @returns {boolean} - True if not empty
 */
function validateRequired(value) {
  return value && value.trim().length > 0;
}

/**
 * Validates claim amount
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} - True if valid amount
 */
function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Validates date format
 * @param {string} date - Date to validate
 * @returns {boolean} - True if valid date
 */
function validateDate(date) {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Shows validation error message
 * @param {string} elementId - ID of element to show error for
 * @param {string} message - Error message to show
 */
function showValidationError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.borderColor = '#dc2626';
    element.style.borderWidth = '2px';
    
    // Remove existing error message
    const existingError = element.parentNode.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
  }
}

/**
 * Clears validation error
 * @param {string} elementId - ID of element to clear error for
 */
function clearValidationError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';
    
    const existingError = element.parentNode.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }
  }
}

/**
 * Validates form data
 * @param {Object} formData - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation result
 */
function validateForm(formData, rules) {
  const errors = {};
  let isValid = true;
  
  for (const field in rules) {
    const rule = rules[field];
    const value = formData[field];
    
    if (rule.required && !validateRequired(value)) {
      errors[field] = `${rule.label || field} is required`;
      isValid = false;
    } else if (value && rule.email && !validateEmail(value)) {
      errors[field] = `${rule.label || field} must be a valid email`;
      isValid = false;
    } else if (value && rule.phone && !validatePhone(value)) {
      errors[field] = `${rule.label || field} must be a valid phone number`;
      isValid = false;
    } else if (value && rule.amount && !validateAmount(value)) {
      errors[field] = `${rule.label || field} must be a valid amount`;
      isValid = false;
    } else if (value && rule.date && !validateDate(value)) {
      errors[field] = `${rule.label || field} must be a valid date`;
      isValid = false;
    }
  }
  
  return { isValid, errors };
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEmail,
    validatePhone,
    validateRequired,
    validateAmount,
    validateDate,
    showValidationError,
    clearValidationError,
    validateForm
  };
}

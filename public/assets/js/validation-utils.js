// Validation utilities for Claim Navigator Resource Center
// Provides form validation and data validation functions

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export function validatePhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validates required field
 * @param {string} value - Value to validate
 * @returns {boolean} - True if not empty
 */
export function validateRequired(value) {
  return value && value.trim().length > 0;
}

/**
 * Validates claim amount
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} - True if valid amount
 */
export function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Validates date format
 * @param {string} date - Date to validate
 * @returns {boolean} - True if valid date
 */
export function validateDate(date) {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Shows validation error message
 * @param {string} elementId - ID of element to show error for
 * @param {string} message - Error message to show
 */
export function showValidationError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.borderColor = '#ef4444';
    element.style.borderWidth = '2px';
    
    // Remove existing error message
    const existingError = element.parentNode.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    `;
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
  }
}

/**
 * Clears validation error
 * @param {string} elementId - ID of element to clear error for
 */
export function clearValidationError(elementId) {
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
export function validateForm(formData, rules) {
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

/**
 * Validates file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    required = false
  } = options;
  
  const errors = [];
  
  if (required && !file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  if (file) {
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates claim data
 * @param {Object} claimData - Claim data to validate
 * @returns {Object} - Validation result
 */
export function validateClaimData(claimData) {
  const rules = {
    claimantName: { required: true, label: 'Claimant Name' },
    policyNumber: { required: true, label: 'Policy Number' },
    claimNumber: { required: true, label: 'Claim Number' },
    incidentDate: { required: true, date: true, label: 'Incident Date' },
    damageAmount: { required: true, amount: true, label: 'Damage Amount' }
  };
  
  return validateForm(claimData, rules);
}

/**
 * Validates document data
 * @param {Object} documentData - Document data to validate
 * @returns {Object} - Validation result
 */
export function validateDocumentData(documentData) {
  const rules = {
    documentType: { required: true, label: 'Document Type' },
    content: { required: true, label: 'Content' }
  };
  
  return validateForm(documentData, rules);
}

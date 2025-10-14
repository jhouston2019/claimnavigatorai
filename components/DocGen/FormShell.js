/**
 * Document Generator Form Shell Component
 * Wraps form with validation, error handling, and submit functionality
 */

class DocumentGeneratorFormShell {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      schema: null,
      defaultValues: {},
      onSubmit: null,
      onValidationError: null,
      locale: 'en',
      ...options
    };
    
    this.form = null;
    this.errors = {};
    this.isSubmitting = false;
    this.locale = this.options.locale;
    
    this.init();
  }

  init() {
    this.createForm();
    this.bindEvents();
    this.loadLocale();
  }

  createForm() {
    this.form = document.createElement('form');
    this.form.className = 'doc-gen-form';
    this.form.setAttribute('novalidate', 'true');
    
    // Create form content container
    const formContent = document.createElement('div');
    formContent.className = 'doc-gen-form-content';
    
    // Create error display
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'doc-gen-form-errors';
    errorDisplay.setAttribute('aria-live', 'polite');
    errorDisplay.setAttribute('aria-atomic', 'true');
    
    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'doc-gen-submit-btn';
    submitButton.innerHTML = `
      <span class="btn-text">${this.getText('generateButton')}</span>
      <span class="btn-spinner" style="display: none;">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
    `;
    
    this.form.appendChild(formContent);
    this.form.appendChild(errorDisplay);
    this.form.appendChild(submitButton);
    
    this.container.appendChild(this.form);
    
    this.formContent = formContent;
    this.errorDisplay = errorDisplay;
    this.submitButton = submitButton;
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    this.form.addEventListener('input', (e) => this.handleInput(e));
    this.form.addEventListener('blur', (e) => this.handleBlur(e));
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.updateSubmitButton(true);
    this.clearErrors();
    
    try {
      // Validate form data
      const formData = this.getFormData();
      const validationResult = this.validateForm(formData);
      
      if (!validationResult.isValid) {
        this.displayErrors(validationResult.errors);
        return;
      }
      
      // Call onSubmit callback
      if (this.options.onSubmit) {
        await this.options.onSubmit(formData);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.displayError('An unexpected error occurred. Please try again.');
    } finally {
      this.isSubmitting = false;
      this.updateSubmitButton(false);
    }
  }

  handleInput(event) {
    const field = event.target;
    if (field.name) {
      this.clearFieldError(field.name);
    }
  }

  handleBlur(event) {
    const field = event.target;
    if (field.name) {
      this.validateField(field);
    }
  }

  validateForm(data) {
    if (!this.options.schema) {
      return { isValid: true, errors: {} };
    }
    
    try {
      this.options.schema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      const errors = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
  }

  validateField(field) {
    if (!this.options.schema || !field.name) return;
    
    const fieldSchema = this.getFieldSchema(field.name);
    if (!fieldSchema) return;
    
    try {
      fieldSchema.parse(field.value);
      this.clearFieldError(field.name);
    } catch (error) {
      this.setFieldError(field.name, error.errors[0]?.message || 'Invalid value');
    }
  }

  getFieldSchema(fieldName) {
    // This would need to be implemented based on the specific schema structure
    // For now, return null to skip field-level validation
    return null;
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle array fields
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  displayErrors(errors) {
    this.errors = errors;
    
    // Clear previous errors
    this.errorDisplay.innerHTML = '';
    
    if (Object.keys(errors).length === 0) return;
    
    const errorList = document.createElement('ul');
    errorList.className = 'doc-gen-error-list';
    
    Object.entries(errors).forEach(([field, message]) => {
      const errorItem = document.createElement('li');
      errorItem.className = 'doc-gen-error-item';
      errorItem.textContent = `${field}: ${message}`;
      errorList.appendChild(errorItem);
      
      // Highlight field
      const fieldElement = this.form.querySelector(`[name="${field}"]`);
      if (fieldElement) {
        fieldElement.classList.add('error');
      }
    });
    
    this.errorDisplay.appendChild(errorList);
    
    // Focus first error field
    const firstErrorField = this.form.querySelector('.error');
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }

  displayError(message) {
    this.errorDisplay.innerHTML = `
      <div class="doc-gen-error-alert">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
      </div>
    `;
  }

  clearErrors() {
    this.errors = {};
    this.errorDisplay.innerHTML = '';
    
    // Remove error styling
    this.form.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
    });
  }

  clearFieldError(fieldName) {
    delete this.errors[fieldName];
    
    const fieldElement = this.form.querySelector(`[name="${fieldName}"]`);
    if (fieldElement) {
      fieldElement.classList.remove('error');
    }
    
    // Update error display
    this.displayErrors(this.errors);
  }

  setFieldError(fieldName, message) {
    this.errors[fieldName] = message;
    this.displayErrors(this.errors);
  }

  updateSubmitButton(isSubmitting) {
    const btnText = this.submitButton.querySelector('.btn-text');
    const btnSpinner = this.submitButton.querySelector('.btn-spinner');
    
    if (isSubmitting) {
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';
      this.submitButton.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
      this.submitButton.disabled = false;
    }
  }

  loadLocale() {
    // Load locale from localStorage or default
    const savedLocale = localStorage.getItem('docGenLocale') || 'en';
    this.setLocale(savedLocale);
  }

  setLocale(locale) {
    this.locale = locale;
    localStorage.setItem('docGenLocale', locale);
    
    // Update button text
    const btnText = this.submitButton.querySelector('.btn-text');
    btnText.textContent = this.getText('generateButton');
  }

  getText(key) {
    // This would load from the locale files
    const texts = {
      en: {
        generateButton: 'Generate Document',
        generating: 'Generating document...',
        error: 'Error generating document'
      },
      es: {
        generateButton: 'Generar Documento',
        generating: 'Generando documento...',
        error: 'Error al generar documento'
      }
    };
    
    return texts[this.locale]?.[key] || texts.en[key] || key;
  }

  // Public API methods
  setSchema(schema) {
    this.options.schema = schema;
  }

  setDefaultValues(values) {
    this.options.defaultValues = values;
    this.populateForm(values);
  }

  populateForm(values) {
    Object.entries(values).forEach(([key, value]) => {
      const field = this.form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          field.checked = value;
        } else {
          field.value = value;
        }
      }
    });
  }

  reset() {
    this.form.reset();
    this.clearErrors();
    this.populateForm(this.options.defaultValues);
  }

  getFormElement() {
    return this.form;
  }

  getFormContent() {
    return this.formContent;
  }
}

// CSS styles
const styles = `
.doc-gen-form {
  max-width: 100%;
  margin: 0 auto;
}

.doc-gen-form-content {
  margin-bottom: 1.5rem;
}

.doc-gen-form-errors {
  margin-bottom: 1rem;
}

.doc-gen-error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-gen-error-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.doc-gen-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 0.75rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.doc-gen-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.doc-gen-submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.doc-gen-submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.doc-gen-submit-btn .btn-spinner {
  display: none;
}

.doc-gen-submit-btn:disabled .btn-spinner {
  display: inline-block;
}

.doc-gen-submit-btn:disabled .btn-text {
  display: none;
}

/* Field error styling */
.doc-gen-form input.error,
.doc-gen-form select.error,
.doc-gen-form textarea.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 1px #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
  .doc-gen-submit-btn {
    padding: 1rem 1.5rem;
    font-size: 1.125rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .doc-gen-error-item,
  .doc-gen-error-alert {
    border-width: 2px;
  }
  
  .doc-gen-submit-btn {
    border: 2px solid #000000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .doc-gen-submit-btn {
    transition: none;
  }
}
`;

// Inject styles
if (!document.querySelector('#doc-gen-form-shell-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'doc-gen-form-shell-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DocumentGeneratorFormShell;
} else {
  window.DocumentGeneratorFormShell = DocumentGeneratorFormShell;
}
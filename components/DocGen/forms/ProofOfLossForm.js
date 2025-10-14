/**
 * Proof of Loss Form Component
 */

class ProofOfLossForm {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      locale: 'en',
      onSubmit: null,
      ...options
    };
    
    this.locale = this.options.locale;
    this.init();
  }

  init() {
    this.createForm();
    this.bindEvents();
  }

  createForm() {
    const form = document.createElement('div');
    form.className = 'proof-of-loss-form';
    
    form.innerHTML = `
      <div class="form-section">
        <h3 class="section-title">${this.getText('policyholderInfo')}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="policyholderName" class="form-label required">
              ${this.getText('policyholderName')}
            </label>
            <input 
              type="text" 
              id="policyholderName" 
              name="policyholderName" 
              class="form-input" 
              required
              placeholder="${this.getText('policyholderNamePlaceholder')}"
            >
          </div>
          
          <div class="form-group">
            <label for="address" class="form-label required">
              ${this.getText('address')}
            </label>
            <textarea 
              id="address" 
              name="address" 
              class="form-textarea" 
              rows="3"
              required
              placeholder="${this.getText('addressPlaceholder')}"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label required">
              ${this.getText('email')}
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              required
              placeholder="${this.getText('emailPlaceholder')}"
            >
          </div>
          
          <div class="form-group">
            <label for="phone" class="form-label required">
              ${this.getText('phone')}
            </label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              class="form-input" 
              required
              placeholder="${this.getText('phonePlaceholder')}"
            >
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">${this.getText('claimInfo')}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="policyNumber" class="form-label required">
              ${this.getText('policyNumber')}
            </label>
            <input 
              type="text" 
              id="policyNumber" 
              name="policyNumber" 
              class="form-input" 
              required
              placeholder="${this.getText('policyNumberPlaceholder')}"
            >
          </div>
          
          <div class="form-group">
            <label for="claimNumber" class="form-label required">
              ${this.getText('claimNumber')}
            </label>
            <input 
              type="text" 
              id="claimNumber" 
              name="claimNumber" 
              class="form-input" 
              required
              placeholder="${this.getText('claimNumberPlaceholder')}"
            >
          </div>
          
          <div class="form-group">
            <label for="dateOfLoss" class="form-label required">
              ${this.getText('dateOfLoss')}
            </label>
            <input 
              type="date" 
              id="dateOfLoss" 
              name="dateOfLoss" 
              class="form-input" 
              required
            >
          </div>
          
          <div class="form-group">
            <label for="lossType" class="form-label required">
              ${this.getText('lossType')}
            </label>
            <select id="lossType" name="lossType" class="form-select" required>
              <option value="">${this.getText('selectLossType')}</option>
              <option value="fire">${this.getText('fire')}</option>
              <option value="water">${this.getText('water')}</option>
              <option value="wind">${this.getText('wind')}</option>
              <option value="hurricane">${this.getText('hurricane')}</option>
              <option value="theft">${this.getText('theft')}</option>
              <option value="auto">${this.getText('auto')}</option>
              <option value="health">${this.getText('health')}</option>
              <option value="other">${this.getText('other')}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">${this.getText('damageInfo')}</h3>
        <div class="form-group">
          <label for="damageDescription" class="form-label required">
            ${this.getText('damageDescription')}
          </label>
          <textarea 
            id="damageDescription" 
            name="damageDescription" 
            class="form-textarea" 
            rows="4"
            required
            placeholder="${this.getText('damageDescriptionPlaceholder')}"
          ></textarea>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="estimatedValueStructure" class="form-label required">
              ${this.getText('estimatedValueStructure')}
            </label>
            <div class="input-group">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                id="estimatedValueStructure" 
                name="estimatedValueStructure" 
                class="form-input" 
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="estimatedValueContents" class="form-label">
              ${this.getText('estimatedValueContents')}
            </label>
            <div class="input-group">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                id="estimatedValueContents" 
                name="estimatedValueContents" 
                class="form-input" 
                min="0"
                step="0.01"
                placeholder="0.00"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="deductible" class="form-label">
              ${this.getText('deductible')}
            </label>
            <div class="input-group">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                id="deductible" 
                name="deductible" 
                class="form-input" 
                min="0"
                step="0.01"
                placeholder="0.00"
              >
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="attachmentsSummary" class="form-label">
            ${this.getText('attachmentsSummary')}
          </label>
          <textarea 
            id="attachmentsSummary" 
            name="attachmentsSummary" 
            class="form-textarea" 
            rows="3"
            placeholder="${this.getText('attachmentsSummaryPlaceholder')}"
          ></textarea>
        </div>
      </div>
    `;
    
    this.container.appendChild(form);
  }

  bindEvents() {
    // Add any specific event handlers here
  }

  getText(key) {
    const texts = {
      en: {
        policyholderInfo: 'Policyholder Information',
        claimInfo: 'Claim Information',
        damageInfo: 'Damage Information',
        policyholderName: 'Policyholder Name',
        policyholderNamePlaceholder: 'Enter full name',
        address: 'Address',
        addressPlaceholder: 'Enter complete address',
        email: 'Email Address',
        emailPlaceholder: 'Enter email address',
        phone: 'Phone Number',
        phonePlaceholder: 'Enter phone number',
        policyNumber: 'Policy Number',
        policyNumberPlaceholder: 'Enter policy number',
        claimNumber: 'Claim Number',
        claimNumberPlaceholder: 'Enter claim number',
        dateOfLoss: 'Date of Loss',
        lossType: 'Type of Loss',
        selectLossType: 'Select type of loss',
        fire: 'Fire',
        water: 'Water Damage',
        wind: 'Wind',
        hurricane: 'Hurricane',
        theft: 'Theft',
        auto: 'Auto',
        health: 'Health',
        other: 'Other',
        damageDescription: 'Damage Description',
        damageDescriptionPlaceholder: 'Describe the damage in detail...',
        estimatedValueStructure: 'Estimated Structure Value',
        estimatedValueContents: 'Estimated Contents Value',
        deductible: 'Deductible Amount',
        attachmentsSummary: 'Supporting Documents Summary',
        attachmentsSummaryPlaceholder: 'List any photos, receipts, or other documents...'
      },
      es: {
        policyholderInfo: 'Información del Asegurado',
        claimInfo: 'Información del Reclamo',
        damageInfo: 'Información de Daños',
        policyholderName: 'Nombre del Asegurado',
        policyholderNamePlaceholder: 'Ingresa el nombre completo',
        address: 'Dirección',
        addressPlaceholder: 'Ingresa la dirección completa',
        email: 'Correo Electrónico',
        emailPlaceholder: 'Ingresa el correo electrónico',
        phone: 'Número de Teléfono',
        phonePlaceholder: 'Ingresa el número de teléfono',
        policyNumber: 'Número de Póliza',
        policyNumberPlaceholder: 'Ingresa el número de póliza',
        claimNumber: 'Número de Reclamo',
        claimNumberPlaceholder: 'Ingresa el número de reclamo',
        dateOfLoss: 'Fecha de Pérdida',
        lossType: 'Tipo de Pérdida',
        selectLossType: 'Selecciona el tipo de pérdida',
        fire: 'Fuego',
        water: 'Daño por Agua',
        wind: 'Viento',
        hurricane: 'Huracán',
        theft: 'Robo',
        auto: 'Auto',
        health: 'Salud',
        other: 'Otro',
        damageDescription: 'Descripción de Daños',
        damageDescriptionPlaceholder: 'Describe el daño en detalle...',
        estimatedValueStructure: 'Valor Estimado de Estructura',
        estimatedValueContents: 'Valor Estimado de Contenidos',
        deductible: 'Monto del Deductible',
        attachmentsSummary: 'Resumen de Documentos de Apoyo',
        attachmentsSummaryPlaceholder: 'Lista fotos, recibos u otros documentos...'
      }
    };
    
    return texts[this.locale]?.[key] || texts.en[key] || key;
  }

  getFormData() {
    const form = this.container.querySelector('.proof-of-loss-form');
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
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

  setLocale(locale) {
    this.locale = locale;
    // Re-render form with new locale
    this.container.innerHTML = '';
    this.createForm();
    this.bindEvents();
  }
}

// CSS styles
const styles = `
.proof-of-loss-form {
  max-width: 100%;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  z-index: 1;
}

.input-group .form-input {
  padding-left: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-section {
    padding: 1rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .form-input,
  .form-select,
  .form-textarea {
    border-width: 2px;
  }
  
  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .form-input,
  .form-select,
  .form-textarea {
    transition: none;
  }
}
`;

// Inject styles
if (!document.querySelector('#proof-of-loss-form-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'proof-of-loss-form-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProofOfLossForm;
} else {
  window.ProofOfLossForm = ProofOfLossForm;
}
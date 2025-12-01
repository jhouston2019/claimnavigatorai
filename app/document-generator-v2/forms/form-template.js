// Form Template JavaScript
let currentDocument = null;
let formData = {};

// Load claim profile, document watermark, and spacing fix modules
if (typeof window !== 'undefined') {
  // Load claim profile module
  const claimProfileScript = document.createElement('script');
  claimProfileScript.src = '/app/assets/js/claim-profile.js';
  document.head.appendChild(claimProfileScript);
  
  // Load document spacing fix module
  const spacingScript = document.createElement('script');
  spacingScript.src = '/app/assets/js/document-spacing-fix.js';
  document.head.appendChild(spacingScript);
  
  // Load document watermark module (after spacing fix)
  const watermarkScript = document.createElement('script');
  watermarkScript.src = '/app/assets/js/document-watermark.js';
  document.head.appendChild(watermarkScript);
}

// Initialize form when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get document ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const docId = urlParams.get('id');
        
        if (!docId) {
            showError('No document ID provided');
            return;
        }

        // Load document templates
        const response = await fetch('/app/document-generator-v2/doc-templates.json');
        if (!response.ok) throw new Error('Failed to load document templates');
        
        const documents = await response.json();
        currentDocument = documents.find(doc => doc.id === docId);
        
        if (!currentDocument) {
            showError('Document not found');
            return;
        }

        // Render the form
        renderForm();
        
    } catch (error) {
        console.error('Error initializing form:', error);
        showError('Failed to load form. Please try again.');
    }
});

// Render the form based on document template
function renderForm() {
    const formContent = document.getElementById('formContent');
    
    const html = `
        <div class="form-title">${currentDocument.title}</div>
        <div class="form-description">${currentDocument.description}</div>
        
        <form id="documentForm">
            ${currentDocument.fields.map(field => renderField(field)).join('')}
            
            <button type="submit" class="submit-btn" id="submitBtn">
                Generate Document
            </button>
        </form>
        
        <div id="resultContainer" style="display: none;"></div>
    `;
    
    formContent.innerHTML = html;
    
    // Add form submit handler
    document.getElementById('documentForm').addEventListener('submit', handleFormSubmit);
}

// Render individual form field
function renderField(field) {
    const required = field.required ? 'form-required' : '';
    
    switch (field.type) {
        case 'textarea':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <textarea 
                        name="${field.name}" 
                        class="form-input form-textarea" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    ></textarea>
                </div>
            `;
            
        case 'select':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <select 
                        name="${field.name}" 
                        class="form-input form-select" 
                        ${field.required ? 'required' : ''}
                    >
                        <option value="">Select ${field.label}</option>
                        ${field.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </div>
            `;
            
        case 'checkbox':
            return `
                <div class="form-group">
                    <label class="form-label">
                        <input 
                            type="checkbox" 
                            name="${field.name}" 
                            class="form-checkbox"
                            ${field.required ? 'required' : ''}
                        >
                        ${field.label}
                    </label>
                </div>
            `;
            
        case 'number':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="number" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                        step="0.01"
                    >
                </div>
            `;
            
        case 'date':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="date" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                    >
                </div>
            `;
            
        case 'time':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="time" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                    >
                </div>
            `;
            
        case 'email':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="email" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    >
                </div>
            `;
            
        case 'tel':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="tel" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    >
                </div>
            `;
            
        default: // text
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="text" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    >
                </div>
            `;
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const resultContainer = document.getElementById('resultContainer');
    
    try {
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating Document...';
        
        // Collect form data
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Add document metadata
        const requestData = {
            documentId: currentDocument.id,
            documentType: currentDocument.title,
            outputType: currentDocument.outputType,
            layoutType: currentDocument.layoutType,
            formData: data,
            timestamp: new Date().toISOString()
        };
        
        // Submit to backend
        const response = await fetch('/.netlify/functions/generate-doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            await showSuccess(result, data);
        } else {
            throw new Error(result.error || 'Document generation failed');
        }
        
    } catch (error) {
        console.error('Error generating document:', error);
        showError('Failed to generate document: ' + error.message);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Document';
    }
}

// Show success message with download link
async function showSuccess(result, formData = {}) {
    const resultContainer = document.getElementById('resultContainer');
    
    // Get the document content and wrap it with watermark if available
    let documentContent = '';
    if (result.html || result.content) {
        const rawContent = result.html || result.content;
        // Clean up spacing (replace double <br><br> with <p></p>)
        const cleanedContent = rawContent.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');
        // Wrap with header/footer watermark if buildDocShell is available
        documentContent = (window.buildDocShell) ? window.buildDocShell(cleanedContent) : cleanedContent;
        
        // Increment generated documents count
        const docKey = "cn_docs_generated";
        const docCount = parseInt(localStorage.getItem(docKey) || "0", 10);
        localStorage.setItem(docKey, String(docCount + 1));
        
        // Store document in list for portfolio
        let docList = JSON.parse(localStorage.getItem("cn_document_list") || "[]");
        const docTitle = (currentDocument && currentDocument.title) ? currentDocument.title : "Claim Document";
        docList.push({
          id: Date.now(),
          title: docTitle,
          timestamp: Date.now()
        });
        localStorage.setItem("cn_document_list", JSON.stringify(docList));
        
        // Log timeline event
        if (window.CNTimeline) {
          window.CNTimeline.log("document_generated", { template: docTitle });
        }
        
        // Trigger real-time Claim Health recalculation
        if (window.CNHealthHooks) {
          window.CNHealthHooks.trigger();
        }
    }
    
    const html = `
        <div class="success">
            <h3>Document Generated Successfully!</h3>
            <p>Your ${currentDocument.title} has been generated and is ready for download.</p>
            ${documentContent ? `<div class="cn-doc-page">${documentContent}</div>` : ''}
            <a href="data:${result.mimeType};base64,${result.contentBase64}" 
               download="${result.filename}" 
               class="download-link">
                Download ${result.filename}
            </a>
        </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
    
    // If this is FNOL, add compliance summary
    if (currentDocument && currentDocument.id === 'first-notice-loss') {
        await addFNOLComplianceSummary(result, formData);
    }
}

// Show error message
function showError(message) {
    const resultContainer = document.getElementById('resultContainer');
    
    const html = `
        <div class="error">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
}

/**
 * Add compliance summary to FNOL success screen
 */
async function addFNOLComplianceSummary(result, formData) {
    try {
        // Get state and carrier from form data
        const state = formData.state || formData.propertyState || '';
        const carrier = formData.insurer || formData.carrier || '';
        const claimType = formData.causeOfLoss || formData.cause_of_loss || 'Property';
        const dateOfLoss = formData.dateOfLoss || formData.date_of_loss || new Date().toISOString().split('T')[0];
        
        if (!state || !carrier) {
            return; // Skip if no state/carrier
        }
        
        // Import compliance helper
        const { getFNOLComplianceSummary } = await import('/app/assets/js/utils/compliance-engine-helper.js');
        
        // Get compliance summary
        const complianceSummary = await getFNOLComplianceSummary(state, carrier, claimType, dateOfLoss);
        
        // Find result container
        const resultContainer = document.getElementById('resultContainer');
        if (!resultContainer) return;
        
        // Create compliance summary panel
        let compliancePanel = document.getElementById('fnol-compliance-summary');
        if (!compliancePanel) {
            compliancePanel = document.createElement('div');
            compliancePanel.id = 'fnol-compliance-summary';
            compliancePanel.className = 'compliance-summary-panel';
            compliancePanel.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0.5rem;';
            resultContainer.appendChild(compliancePanel);
        }
        
        // Build compliance summary HTML
        let html = '<h3 style="margin-top: 0; color: #ffffff !important;">Compliance Summary</h3>';
        
        if (complianceSummary.requiredDeadlines && complianceSummary.requiredDeadlines.length > 0) {
            html += '<div style="margin-bottom: 1rem;"><strong>Required Deadlines:</strong><ul style="margin-top: 0.5rem; padding-left: 1.5rem;">';
            complianceSummary.requiredDeadlines.forEach(deadline => {
                html += `<li>${deadline}</li>`;
            });
            html += '</ul></div>';
        }
        
        if (complianceSummary.fastNoticeWarning) {
            html += `<div style="margin-bottom: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem;"><strong>⚠️ Fast Notice Required:</strong><p style="margin-top: 0.5rem;">Your state requires fast notice. Ensure you submit this FNOL immediately.</p></div>`;
        }
        
        if (complianceSummary.complianceChecklist && complianceSummary.complianceChecklist.length > 0) {
            html += '<div style="margin-bottom: 1rem;"><strong>Initial Compliance Checklist:</strong><ul style="margin-top: 0.5rem; padding-left: 1.5rem;">';
            complianceSummary.complianceChecklist.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += '</ul></div>';
        }
        
        html += `<a href="/app/resource-center/compliance-engine.html" style="color: #dbeafe !important; text-decoration: underline; display: inline-block; margin-top: 1rem;">Open Full Compliance Report →</a>`;
        
        compliancePanel.innerHTML = html;
        
    } catch (error) {
        console.error('Error adding FNOL compliance summary:', error);
        // Don't block FNOL success if compliance check fails
    }
}
